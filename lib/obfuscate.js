import { customAlphabet } from 'nanoid';

const hex32 = customAlphabet('abcdef0123456789', 32);
const alnum40 = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 40);
const tok24 = customAlphabet('abcdef0123456789', 24);

export const generateLoaderKey = () => hex32();
export const generateScriptKey = () => alnum40();
export const generateKeySystemToken = () => tok24();

// XOR-based string obfuscation so the URL/key aren't in plain text in the loader
function xorEncode(str, key) {
  const k = key.split('').map(c => c.charCodeAt(0));
  return str.split('').map((c, i) => (c.charCodeAt(0) ^ k[i % k.length]).toString(16).padStart(2, '0')).join('');
}

// The loader Lua - all strings XOR-encoded so the real URL/key can't be read from source
export function buildLoaderScript(loaderKey, siteUrl, keyProtected, useKeySystem) {
  const base = siteUrl.replace(/\/$/, '');
  const xorKey = loaderKey.slice(0, 8); // 8-char xor key derived from loader key

  const encBase = xorEncode(base, xorKey);
  const encLoaderKey = xorEncode(loaderKey, xorKey);
  const encExecPath = xorEncode(`/api/loader/${loaderKey}/exec`, xorKey);
  const encTokenPath = xorEncode(`/api/key-system/token`, xorKey);

  // Shared decode + http helper embedded in every loader
  const shared = `local _k=string.char(${xorKey.split('').map(c => c.charCodeAt(0)).join(',')})
local function _d(h)local r=""local i=1 while i<#h do local b=tonumber(h:sub(i,i+1),16)r=r..string.char(b~string.byte(_k,(i//2)%#_k+1))i=i+2 end return r end
local _base=_d("${encBase}")
local _lk=_d("${encLoaderKey}")
local _ep=_d("${encExecPath}")
local HS=game:GetService("HttpService")
local function _post(path,body)
  local ok,r=pcall(function()
    return HS:RequestAsync({Url=_base..path,Method="POST",Headers={["Content-Type"]="application/json"},Body=HS:JSONEncode(body)})
  end)
  if ok and r and r.Success then return HS:JSONDecode(r.Body) end
  return nil
end
local Players=game:GetService("Players")
local LP=Players.LocalPlayer
local _n=(LP and LP.Name) or "Server"
local _h=""
pcall(function() _h=tostring(game:GetService("RbxAnalyticsService"):GetClientId()):gsub("-",""):upper() end)`;

  if (useKeySystem) {
    const encTokPath = xorEncode(`/api/key-system/token`, xorKey);
    return `--// Luvenn Protected Script //--
${shared}
local _tp=_d("${encTokPath}")
if not LP then warn("[Luvenn] Key system requires LocalScript") return end
-- Get key page token
local _td=_post(_tp,{key=_lk,n=_n,h=_h})
local _url=(_td and _td.url) or ""
-- UI
local _sg=Instance.new("ScreenGui")
_sg.Name="Lv"..math.random(1e5,9e5)
_sg.ResetOnSpawn=false
_sg.ZIndexBehavior=Enum.ZIndexBehavior.Sibling
_sg.IgnoreGuiInset=true
pcall(function() _sg.Parent=game:GetService("CoreGui") end)
if not _sg.Parent then _sg.Parent=LP.PlayerGui end
local _bg=Instance.new("Frame",_sg)
_bg.Size=UDim2.fromOffset(420,280)
_bg.Position=UDim2.new(0.5,-210,0.5,-140)
_bg.BackgroundColor3=Color3.fromRGB(10,9,15)
_bg.BorderSizePixel=0
_bg.Active=true
_bg.Draggable=true
Instance.new("UICorner",_bg).CornerRadius=UDim.new(0,16)
-- Gradient border effect via ImageLabel
local _bdr=Instance.new("UIStroke",_bg)
_bdr.Color=Color3.fromRGB(120,80,220)
_bdr.Thickness=1.5
_bdr.Transparency=0.5
-- Top bar
local _tb=Instance.new("Frame",_bg)
_tb.Size=UDim2.new(1,0,0,52)
_tb.BackgroundColor3=Color3.fromRGB(18,16,28)
_tb.BorderSizePixel=0
local _tbc=Instance.new("UICorner",_tb)
_tbc.CornerRadius=UDim.new(0,16)
local _tbfix=Instance.new("Frame",_tb)
_tbfix.Size=UDim2.new(1,0,0.5,0)
_tbfix.Position=UDim2.new(0,0,0.5,0)
_tbfix.BackgroundColor3=Color3.fromRGB(18,16,28)
_tbfix.BorderSizePixel=0
local _logo=Instance.new("TextLabel",_tb)
_logo.Size=UDim2.new(1,-60,1,0)
_logo.Position=UDim2.fromOffset(18,0)
_logo.BackgroundTransparency=1
_logo.Text="Luvenn"
_logo.TextColor3=Color3.fromRGB(160,120,255)
_logo.Font=Enum.Font.GothamBold
_logo.TextSize=16
_logo.TextXAlignment=Enum.TextXAlignment.Left
local _sub=Instance.new("TextLabel",_bg)
_sub.Size=UDim2.new(1,-32,0,28)
_sub.Position=UDim2.fromOffset(16,60)
_sub.BackgroundTransparency=1
_sub.TextColor3=Color3.fromRGB(120,110,150)
_sub.Font=Enum.Font.Gotham
_sub.TextSize=12
_sub.TextWrapped=true
_sub.TextXAlignment=Enum.TextXAlignment.Left
_sub.Text="Complete the tasks below to unlock this script."
-- Close btn
local _x=Instance.new("TextButton",_tb)
_x.Size=UDim2.fromOffset(30,30)
_x.Position=UDim2.new(1,-40,0.5,-15)
_x.BackgroundColor3=Color3.fromRGB(40,35,60)
_x.Text="✕"
_x.TextColor3=Color3.fromRGB(180,170,210)
_x.Font=Enum.Font.GothamBold
_x.TextSize=13
_x.BorderSizePixel=0
Instance.new("UICorner",_x).CornerRadius=UDim.new(0,8)
_x.MouseButton1Click:Connect(function() _sg:Destroy() end)
-- Link button
local _lb=Instance.new("TextButton",_bg)
_lb.Size=UDim2.new(1,-32,0,40)
_lb.Position=UDim2.fromOffset(16,96)
_lb.BackgroundColor3=Color3.fromRGB(100,60,200)
_lb.Text=_url~="" and "Copy Key Link" or "Fetching..."
_lb.TextColor3=Color3.fromRGB(255,255,255)
_lb.Font=Enum.Font.GothamBold
_lb.TextSize=13
_lb.BorderSizePixel=0
Instance.new("UICorner",_lb).CornerRadius=UDim.new(0,10)
if _url~="" then
  _lb.MouseButton1Click:Connect(function()
    setclipboard(_url)
    _lb.Text="Copied!"
    task.delay(2,function() if _lb then _lb.Text="Copy Key Link" end end)
  end)
end
-- Divider
local _dv=Instance.new("Frame",_bg)
_dv.Size=UDim2.new(1,-32,0,1)
_dv.Position=UDim2.fromOffset(16,148)
_dv.BackgroundColor3=Color3.fromRGB(40,35,60)
_dv.BorderSizePixel=0
-- Key input
local _ki=Instance.new("TextBox",_bg)
_ki.Size=UDim2.new(1,-32,0,40)
_ki.Position=UDim2.fromOffset(16,160)
_ki.BackgroundColor3=Color3.fromRGB(22,20,35)
_ki.Text=""
_ki.PlaceholderText="Paste key here..."
_ki.TextColor3=Color3.fromRGB(220,215,240)
_ki.PlaceholderColor3=Color3.fromRGB(80,70,110)
_ki.Font=Enum.Font.Code
_ki.TextSize=12
_ki.ClearTextOnFocus=false
_ki.BorderSizePixel=0
Instance.new("UICorner",_ki).CornerRadius=UDim.new(0,10)
local _ks=Instance.new("UIStroke",_ki)
_ks.Color=Color3.fromRGB(70,55,120)
_ks.Thickness=1
-- Status
local _st=Instance.new("TextLabel",_bg)
_st.Size=UDim2.new(1,-32,0,18)
_st.Position=UDim2.fromOffset(16,208)
_st.BackgroundTransparency=1
_st.TextColor3=Color3.fromRGB(100,90,140)
_st.Font=Enum.Font.Gotham
_st.TextSize=11
_st.TextXAlignment=Enum.TextXAlignment.Left
_st.Text=""
-- Submit
local _sb=Instance.new("TextButton",_bg)
_sb.Size=UDim2.new(1,-32,0,38)
_sb.Position=UDim2.fromOffset(16,234)
_sb.BackgroundColor3=Color3.fromRGB(30,27,48)
_sb.Text="Verify Key"
_sb.TextColor3=Color3.fromRGB(200,195,230)
_sb.Font=Enum.Font.GothamBold
_sb.TextSize=13
_sb.BorderSizePixel=0
Instance.new("UICorner",_sb).CornerRadius=UDim.new(0,10)
local _sbs=Instance.new("UIStroke",_sb)
_sbs.Color=Color3.fromRGB(70,55,120)
_sbs.Thickness=1
_sb.MouseButton1Click:Connect(function()
  local k=_ki.Text:match("^%s*(.-)%s*$")
  if #k<10 then _st.Text="Key too short."_st.TextColor3=Color3.fromRGB(220,80,80) return end
  _sb.Text="Checking..."
  _sb.BackgroundColor3=Color3.fromRGB(22,20,35)
  _st.Text="Verifying key..."
  _st.TextColor3=Color3.fromRGB(100,90,140)
  local d=_post(_ep,{k=k,n=_n,h=_h})
  if not d or not d.s then
    _st.Text=(d and d.e) or "Invalid key."
    _st.TextColor3=Color3.fromRGB(220,80,80)
    _sb.Text="Verify Key"
    _sb.BackgroundColor3=Color3.fromRGB(30,27,48)
    return
  end
  _sg:Destroy()
  local fn,le=loadstring(d.s)
  if not fn then warn("[Luvenn] "..tostring(le)) return end
  fn()
end)`;
  }

  if (keyProtected) {
    return `--// Luvenn Protected Script //--
${shared}
if not script_key then error("[Luvenn] script_key must be set before this loadstring.",2) end
local d=_post(_ep,{k=script_key,n=_n,h=_h})
if not d or not d.s then error("[Luvenn] "..(d and d.e or "Unauthorized"),2) end
local fn,le=loadstring(d.s)
if not fn then error("[Luvenn] "..tostring(le),2) end
fn()`;
  }

  return `--// Luvenn Protected Script //--
${shared}
local d=_post(_ep,{n=_n,h=_h})
if not d or not d.s then error("[Luvenn] "..(d and d.e or "Unavailable"),2) end
local fn,le=loadstring(d.s)
if not fn then error("[Luvenn] "..tostring(le),2) end
fn()`;
}
