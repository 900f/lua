import { customAlphabet } from 'nanoid';

const hex32 = customAlphabet('abcdef0123456789', 32);
const alnum40 = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 40);
const tok24 = customAlphabet('abcdef0123456789', 24);

export const generateLoaderKey = () => hex32();
export const generateScriptKey = () => alnum40();
export const generateKeySystemToken = () => tok24();

// XOR-encode a string into hex using key bytes
function xorEncode(str, keyStr) {
  const k = keyStr.split('').map(c => c.charCodeAt(0));
  return str.split('').map((c, i) => (c.charCodeAt(0) ^ k[i % k.length]).toString(16).padStart(2, '0')).join('');
}

// Build the Lua XOR key as a string.char() call
function luaKey(keyStr) {
  return keyStr.split('').map(c => c.charCodeAt(0)).join(',');
}

/*
  Lua 5.1 compatible XOR decoder:
  - Uses math.floor(i/2) instead of i//2 (Lua 5.3+ only)
  - Uses string.byte(_k, math.floor(i/2)%#_k+1)
  - i is the 1-based index into the hex string, stepping by 2
*/
function buildDecoder(keyStr) {
  return `local _k=string.char(${luaKey(keyStr)})
local function _d(h)
  local r=""
  local i=1
  while i<=#h-1 do
    local b=tonumber(string.sub(h,i,i+1),16)
    local ki=math.floor((i-1)/2)%#_k+1
    r=r..string.char(b~string.byte(_k,ki))
    i=i+2
  end
  return r
end`;
}

export function buildLoaderScript(loaderKey, siteUrl, keyProtected, useKeySystem) {
  const base = siteUrl.replace(/\/$/, '');
  // Use first 8 chars of loaderKey as XOR key
  const xorKey = loaderKey.slice(0, 8);

  const encBase    = xorEncode(base, xorKey);
  const encLK      = xorEncode(loaderKey, xorKey);
  const encExecPath = xorEncode(`/api/loader/${loaderKey}/exec`, xorKey);
  const encTokPath  = xorEncode(`/api/key-system/token`, xorKey);

  // Shared preamble: decode helper + HTTP helper + player vars
  // All strings are XOR-encoded so plain text URL is never visible
  const shared = `${buildDecoder(xorKey)}
local _base=_d("${encBase}")
local _lk=_d("${encLK}")
local _ep=_d("${encExecPath}")
local HS=game:GetService("HttpService")
local Players=game:GetService("Players")
local LP=Players.LocalPlayer
local _n=(LP and LP.Name) or "Server"
local _h=""
pcall(function()
  _h=tostring(game:GetService("RbxAnalyticsService"):GetClientId()):gsub("-",""):upper()
end)
local function _post(path,body)
  local ok,r=pcall(function()
    return HS:RequestAsync({
      Url=_base..path,
      Method="POST",
      Headers={["Content-Type"]="application/json"},
      Body=HS:JSONEncode(body)
    })
  end)
  if ok and r and r.Success then
    local ok2,d=pcall(function() return HS:JSONDecode(r.Body) end)
    if ok2 then return d end
  end
  return nil
end`;

  // ── KEY SYSTEM (in-game UI) ───────────────────────────────────────────────
  if (useKeySystem) {
    return `--[[ Luvenn Protected ]]--
${shared}
local _tp=_d("${encTokPath}")
if not LP then
  warn("[Luvenn] Key system requires a LocalScript context.")
  return
end
-- Fetch key page URL once
local _td=_post(_tp,{key=_lk,n=_n,h=_h})
local _url=(_td and _td.url) or ""
-- Build draggable UI
local _sg=Instance.new("ScreenGui")
_sg.Name="Lv"..tostring(math.random(10000,99999))
_sg.ResetOnSpawn=false
_sg.ZIndexBehavior=Enum.ZIndexBehavior.Sibling
_sg.IgnoreGuiInset=true
local _ok=pcall(function() _sg.Parent=game:GetService("CoreGui") end)
if not _ok then _sg.Parent=LP.PlayerGui end
-- Main frame (draggable)
local _bg=Instance.new("Frame",_sg)
_bg.Size=UDim2.fromOffset(430,290)
_bg.Position=UDim2.new(0.5,-215,0.5,-145)
_bg.BackgroundColor3=Color3.fromRGB(10,9,15)
_bg.BorderSizePixel=0
_bg.Active=true
_bg.Draggable=true
Instance.new("UICorner",_bg).CornerRadius=UDim.new(0,16)
local _stroke=Instance.new("UIStroke",_bg)
_stroke.Color=Color3.fromRGB(110,70,210)
_stroke.Thickness=1.5
_stroke.Transparency=0.4
-- Header bar
local _hdr=Instance.new("Frame",_bg)
_hdr.Size=UDim2.new(1,0,0,50)
_hdr.BackgroundColor3=Color3.fromRGB(17,15,26)
_hdr.BorderSizePixel=0
Instance.new("UICorner",_hdr).CornerRadius=UDim.new(0,16)
local _hfix=Instance.new("Frame",_hdr)
_hfix.Size=UDim2.new(1,0,0.5,0)
_hfix.Position=UDim2.new(0,0,0.5,0)
_hfix.BackgroundColor3=Color3.fromRGB(17,15,26)
_hfix.BorderSizePixel=0
local _title=Instance.new("TextLabel",_hdr)
_title.Size=UDim2.new(1,-52,1,0)
_title.Position=UDim2.fromOffset(16,0)
_title.BackgroundTransparency=1
_title.Text="Luvenn — Key Required"
_title.TextColor3=Color3.fromRGB(200,185,255)
_title.Font=Enum.Font.GothamBold
_title.TextSize=14
_title.TextXAlignment=Enum.TextXAlignment.Left
-- Close button
local _xb=Instance.new("TextButton",_hdr)
_xb.Size=UDim2.fromOffset(28,28)
_xb.Position=UDim2.new(1,-40,0.5,-14)
_xb.BackgroundColor3=Color3.fromRGB(35,30,52)
_xb.Text="✕"
_xb.TextColor3=Color3.fromRGB(160,145,200)
_xb.Font=Enum.Font.GothamBold
_xb.TextSize=12
_xb.BorderSizePixel=0
Instance.new("UICorner",_xb).CornerRadius=UDim.new(0,6)
_xb.MouseButton1Click:Connect(function() _sg:Destroy() end)
-- Sub label
local _sub=Instance.new("TextLabel",_bg)
_sub.Size=UDim2.new(1,-32,0,28)
_sub.Position=UDim2.fromOffset(16,57)
_sub.BackgroundTransparency=1
_sub.Text="Get a key from the link, then paste it below."
_sub.TextColor3=Color3.fromRGB(110,95,148)
_sub.Font=Enum.Font.Gotham
_sub.TextSize=12
_sub.TextWrapped=true
_sub.TextXAlignment=Enum.TextXAlignment.Left
-- Copy link button
local _lb=Instance.new("TextButton",_bg)
_lb.Size=UDim2.new(1,-32,0,40)
_lb.Position=UDim2.fromOffset(16,92)
_lb.BackgroundColor3=Color3.fromRGB(90,50,185)
_lb.Text=(_url~="") and "Copy Key Link" or "Fetching link..."
_lb.TextColor3=Color3.fromRGB(255,255,255)
_lb.Font=Enum.Font.GothamBold
_lb.TextSize=13
_lb.BorderSizePixel=0
Instance.new("UICorner",_lb).CornerRadius=UDim.new(0,10)
if _url~="" then
  _lb.MouseButton1Click:Connect(function()
    setclipboard(_url)
    _lb.Text="Copied!"
    task.delay(2,function() if _lb and _lb.Parent then _lb.Text="Copy Key Link" end end)
  end)
end
-- Divider
local _div=Instance.new("Frame",_bg)
_div.Size=UDim2.new(1,-32,0,1)
_div.Position=UDim2.fromOffset(16,144)
_div.BackgroundColor3=Color3.fromRGB(35,30,55)
_div.BorderSizePixel=0
-- Key input
local _ki=Instance.new("TextBox",_bg)
_ki.Size=UDim2.new(1,-32,0,40)
_ki.Position=UDim2.fromOffset(16,153)
_ki.BackgroundColor3=Color3.fromRGB(20,18,32)
_ki.Text=""
_ki.PlaceholderText="Paste key here..."
_ki.TextColor3=Color3.fromRGB(215,205,240)
_ki.PlaceholderColor3=Color3.fromRGB(75,65,108)
_ki.Font=Enum.Font.Code
_ki.TextSize=12
_ki.ClearTextOnFocus=false
_ki.BorderSizePixel=0
Instance.new("UICorner",_ki).CornerRadius=UDim.new(0,8)
local _ks=Instance.new("UIStroke",_ki)
_ks.Color=Color3.fromRGB(65,50,110)
_ks.Thickness=1
-- Status label
local _sl=Instance.new("TextLabel",_bg)
_sl.Size=UDim2.new(1,-32,0,18)
_sl.Position=UDim2.fromOffset(16,200)
_sl.BackgroundTransparency=1
_sl.Text=""
_sl.TextColor3=Color3.fromRGB(100,88,140)
_sl.Font=Enum.Font.Gotham
_sl.TextSize=11
_sl.TextXAlignment=Enum.TextXAlignment.Left
-- Submit button
local _sb=Instance.new("TextButton",_bg)
_sb.Size=UDim2.new(1,-32,0,38)
_sb.Position=UDim2.fromOffset(16,225)
_sb.BackgroundColor3=Color3.fromRGB(28,25,44)
_sb.Text="Verify Key"
_sb.TextColor3=Color3.fromRGB(190,180,225)
_sb.Font=Enum.Font.GothamBold
_sb.TextSize=13
_sb.BorderSizePixel=0
Instance.new("UICorner",_sb).CornerRadius=UDim.new(0,10)
local _ss=Instance.new("UIStroke",_sb)
_ss.Color=Color3.fromRGB(65,50,110)
_ss.Thickness=1
_sb.MouseButton1Click:Connect(function()
  local k=string.match(_ki.Text,"^%s*(.-)%s*$")
  if #k<10 then
    _sl.Text="Key too short."
    _sl.TextColor3=Color3.fromRGB(210,70,70)
    return
  end
  _sb.Text="Checking..."
  _sb.BackgroundColor3=Color3.fromRGB(20,18,32)
  _sl.Text="Verifying..."
  _sl.TextColor3=Color3.fromRGB(100,88,140)
  local d=_post(_ep,{k=k,n=_n,h=_h})
  if not d or not d.s then
    _sl.Text=(d and d.e) or "Invalid key."
    _sl.TextColor3=Color3.fromRGB(210,70,70)
    _sb.Text="Verify Key"
    _sb.BackgroundColor3=Color3.fromRGB(28,25,44)
    return
  end
  _sg:Destroy()
  local fn,le=loadstring(d.s)
  if not fn then
    warn("[Luvenn] Load error: "..tostring(le))
    return
  end
  fn()
end)`;
  }

  // ── KEY PROTECTED ─────────────────────────────────────────────────────────
  if (keyProtected) {
    return `--[[ Luvenn Protected ]]--
${shared}
if not script_key then
  error("[Luvenn] Define script_key before this loadstring.", 2)
end
local d=_post(_ep,{k=script_key,n=_n,h=_h})
if not d or not d.s then
  error("[Luvenn] "..(d and d.e or "Unauthorized"), 2)
end
local fn,le=loadstring(d.s)
if not fn then
  error("[Luvenn] "..tostring(le), 2)
end
fn()`;
  }

  // ── OPEN (no key) ─────────────────────────────────────────────────────────
  return `--[[ Luvenn Protected ]]--
${shared}
local d=_post(_ep,{n=_n,h=_h})
if not d or not d.s then
  error("[Luvenn] "..(d and d.e or "Script unavailable"), 2)
end
local fn,le=loadstring(d.s)
if not fn then
  error("[Luvenn] "..tostring(le), 2)
end
fn()`;
}
