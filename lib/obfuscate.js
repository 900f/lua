import { customAlphabet } from 'nanoid';

const hex32  = customAlphabet('abcdef0123456789', 32);
const alnum40 = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 40);
const tok24  = customAlphabet('abcdef0123456789', 24);

export const generateLoaderKey     = () => hex32();
export const generateScriptKey     = () => alnum40();
export const generateKeySystemToken = () => tok24();

function xorEncode(str, keyStr) {
  const k = keyStr.split('').map(c => c.charCodeAt(0));
  return str.split('').map((c, i) =>
    (c.charCodeAt(0) ^ k[i % k.length]).toString(16).padStart(2, '0')
  ).join('');
}

// Lua 5.1 compatible XOR decode function
// Uses math.floor instead of // operator (5.3+ only)
// Uses string.sub/tonumber instead of gmatch for clarity
function luaDecoder(keyStr) {
  const keyBytes = keyStr.split('').map(c => c.charCodeAt(0)).join(',');
  return `local _K=string.char(${keyBytes})
local function _D(h)
  local o=""
  local i=1
  local kl=#_K
  while i<=#h-1 do
    local b=tonumber(string.sub(h,i,i+1),16)
    local ki=math.floor((i-1)/2)%kl+1
    o=o..string.char(b~string.byte(_K,ki))
    i=i+2
  end
  return o
end`;
}

// Shared preamble used by all loader types
function sharedPreamble(encBase, encLK, encExecPath, keyStr) {
  return `${luaDecoder(keyStr)}
local _B=_D("${encBase}")
local _LK=_D("${encLK}")
local _EP=_D("${encExecPath}")
local HS=game:GetService("HttpService")
local PL=game:GetService("Players")
local LP=PL.LocalPlayer
local _N=(LP and LP.Name) or "Server"
local _H=""
pcall(function()
  _H=tostring(game:GetService("RbxAnalyticsService"):GetClientId()):gsub("-",""):upper()
end)
local function _POST(path,body)
  local ok,res=pcall(function()
    return HS:RequestAsync({
      Url=_B..path,
      Method="POST",
      Headers={["Content-Type"]="application/json"},
      Body=HS:JSONEncode(body)
    })
  end)
  if ok and res and res.Success then
    local ok2,d=pcall(function() return HS:JSONDecode(res.Body) end)
    if ok2 and d then return d end
  end
  return nil
end`;
}

export function buildLoaderScript(loaderKey, siteUrl, keyProtected, useKeySystem) {
  const base    = siteUrl.replace(/\/$/, '');
  const xk      = loaderKey.slice(0, 8);
  const encBase = xorEncode(base, xk);
  const encLK   = xorEncode(loaderKey, xk);
  const encEP   = xorEncode(`/api/loader/${loaderKey}/exec`, xk);
  const encTP   = xorEncode(`/api/key-system/token`, xk);
  const pre     = sharedPreamble(encBase, encLK, encEP, xk);

  // ── OPEN (no key) ─────────────────────────────────────────────────────────
  if (!keyProtected && !useKeySystem) {
    return `local _r=_POST(_EP,{n=_N,h=_H})
if not _r or not _r.s then
  error("[Luvenn] "..((_r and _r.e) or "Unavailable"),2)
end
local fn,le=loadstring(_r.s)
if not fn then error("[Luvenn] "..tostring(le),2) end
fn()`.replace(/^/, pre + '\n');
  }

  // ── KEY PROTECTED ─────────────────────────────────────────────────────────
  if (keyProtected && !useKeySystem) {
    return `${pre}
if not script_key then
  error("[Luvenn] Set script_key before this loadstring.",2)
end
local _r=_POST(_EP,{k=script_key,n=_N,h=_H})
if not _r or not _r.s then
  error("[Luvenn] "..((_r and _r.e) or "Unauthorized"),2)
end
local fn,le=loadstring(_r.s)
if not fn then error("[Luvenn] "..tostring(le),2) end
fn()`;
  }

  // ── KEY SYSTEM (in-game UI) ───────────────────────────────────────────────
  return `${pre}
local _TP=_D("${encTP}")
if not LP then
  warn("[Luvenn] Key system needs a LocalScript context.")
  return
end
-- Fetch key page link (runs once, no loop)
local _td=_POST(_TP,{key=_LK,n=_N,h=_H})
local _URL=(_td and _td.url) or ""
-- ── Build UI ──
local sg=Instance.new("ScreenGui")
sg.Name="Luvenn"
sg.ResetOnSpawn=false
sg.ZIndexBehavior=Enum.ZIndexBehavior.Sibling
sg.IgnoreGuiInset=true
local _ok=pcall(function() sg.Parent=game:GetService("CoreGui") end)
if not _ok then sg.Parent=LP.PlayerGui end
-- Backdrop blur
local blur=Instance.new("BlurEffect")
blur.Size=8
local _ok2=pcall(function() blur.Parent=game:GetService("Lighting") end)
-- Main frame
local fr=Instance.new("Frame",sg)
fr.Size=UDim2.fromOffset(400,268)
fr.Position=UDim2.new(0.5,-200,0.5,-134)
fr.BackgroundColor3=Color3.fromRGB(11,9,16)
fr.BorderSizePixel=0
fr.Active=true
fr.Draggable=true
Instance.new("UICorner",fr).CornerRadius=UDim.new(0,14)
-- Border
local bdr=Instance.new("UIStroke",fr)
bdr.Color=Color3.fromRGB(100,60,200)
bdr.Thickness=1.5
bdr.Transparency=0.35
-- Top bar
local tb=Instance.new("Frame",fr)
tb.Size=UDim2.new(1,0,0,46)
tb.BackgroundColor3=Color3.fromRGB(16,14,24)
tb.BorderSizePixel=0
local c1=Instance.new("UICorner",tb); c1.CornerRadius=UDim.new(0,14)
local fix=Instance.new("Frame",tb)
fix.Size=UDim2.new(1,0,0.5,0)
fix.Position=UDim2.new(0,0,0.5,0)
fix.BackgroundColor3=Color3.fromRGB(16,14,24)
fix.BorderSizePixel=0
-- Title
local tl=Instance.new("TextLabel",tb)
tl.Size=UDim2.new(1,-48,1,0)
tl.Position=UDim2.fromOffset(14,0)
tl.BackgroundTransparency=1
tl.Text="Luvenn  —  Key Required"
tl.TextColor3=Color3.fromRGB(185,165,255)
tl.Font=Enum.Font.GothamBold
tl.TextSize=13
tl.TextXAlignment=Enum.TextXAlignment.Left
-- Close
local xb=Instance.new("TextButton",tb)
xb.Size=UDim2.fromOffset(26,26)
xb.Position=UDim2.new(1,-36,0.5,-13)
xb.BackgroundColor3=Color3.fromRGB(32,28,48)
xb.Text="x"
xb.TextColor3=Color3.fromRGB(150,135,195)
xb.Font=Enum.Font.GothamBold
xb.TextSize=12
xb.BorderSizePixel=0
Instance.new("UICorner",xb).CornerRadius=UDim.new(0,6)
xb.MouseButton1Click:Connect(function()
  if _ok2 then blur:Destroy() end
  sg:Destroy()
end)
-- Subtitle
local sub=Instance.new("TextLabel",fr)
sub.Size=UDim2.new(1,-28,0,24)
sub.Position=UDim2.fromOffset(14,52)
sub.BackgroundTransparency=1
sub.Text="Get a key from the link below, then paste it to continue."
sub.TextColor3=Color3.fromRGB(100,88,140)
sub.Font=Enum.Font.Gotham
sub.TextSize=11
sub.TextXAlignment=Enum.TextXAlignment.Left
-- Copy link button
local lb=Instance.new("TextButton",fr)
lb.Size=UDim2.new(1,-28,0,38)
lb.Position=UDim2.fromOffset(14,82)
lb.BackgroundColor3=Color3.fromRGB(88,48,180)
lb.Text=(_URL~="") and "Copy Key Link" or "Loading..."
lb.TextColor3=Color3.fromRGB(255,255,255)
lb.Font=Enum.Font.GothamBold
lb.TextSize=13
lb.BorderSizePixel=0
Instance.new("UICorner",lb).CornerRadius=UDim.new(0,9)
if _URL~="" then
  lb.MouseButton1Click:Connect(function()
    setclipboard(_URL)
    lb.Text="Copied!"
    task.delay(2,function()
      if lb and lb.Parent then lb.Text="Copy Key Link" end
    end)
  end)
end
-- Divider
local dv=Instance.new("Frame",fr)
dv.Size=UDim2.new(1,-28,0,1)
dv.Position=UDim2.fromOffset(14,132)
dv.BackgroundColor3=Color3.fromRGB(32,28,48)
dv.BorderSizePixel=0
-- Key input
local ki=Instance.new("TextBox",fr)
ki.Size=UDim2.new(1,-28,0,38)
ki.Position=UDim2.fromOffset(14,141)
ki.BackgroundColor3=Color3.fromRGB(18,16,28)
ki.Text=""
ki.PlaceholderText="Paste your key here..."
ki.TextColor3=Color3.fromRGB(210,200,235)
ki.PlaceholderColor3=Color3.fromRGB(70,60,105)
ki.Font=Enum.Font.Code
ki.TextSize=11
ki.ClearTextOnFocus=false
ki.BorderSizePixel=0
Instance.new("UICorner",ki).CornerRadius=UDim.new(0,8)
local ks=Instance.new("UIStroke",ki)
ks.Color=Color3.fromRGB(60,48,105)
ks.Thickness=1
-- Status
local sl=Instance.new("TextLabel",fr)
sl.Size=UDim2.new(1,-28,0,16)
sl.Position=UDim2.fromOffset(14,185)
sl.BackgroundTransparency=1
sl.Text=""
sl.TextColor3=Color3.fromRGB(95,82,132)
sl.Font=Enum.Font.Gotham
sl.TextSize=11
sl.TextXAlignment=Enum.TextXAlignment.Left
-- Submit
local sb=Instance.new("TextButton",fr)
sb.Size=UDim2.new(1,-28,0,36)
sb.Position=UDim2.fromOffset(14,208)
sb.BackgroundColor3=Color3.fromRGB(24,22,38)
sb.Text="Verify Key"
sb.TextColor3=Color3.fromRGB(185,175,220)
sb.Font=Enum.Font.GothamBold
sb.TextSize=13
sb.BorderSizePixel=0
Instance.new("UICorner",sb).CornerRadius=UDim.new(0,9)
local ss=Instance.new("UIStroke",sb)
ss.Color=Color3.fromRGB(60,48,105)
ss.Thickness=1
-- Verify logic
sb.MouseButton1Click:Connect(function()
  local k=ki.Text:match("^%s*(.-)%s*$")
  if #k<8 then
    sl.Text="Key too short."
    sl.TextColor3=Color3.fromRGB(200,60,60)
    return
  end
  sb.Text="Checking..."
  sb.BackgroundColor3=Color3.fromRGB(16,14,26)
  sl.Text="Verifying..."
  sl.TextColor3=Color3.fromRGB(95,82,132)
  local _r=_POST(_EP,{k=k,n=_N,h=_H})
  if not _r or not _r.s then
    local msg=(_r and _r.e) or "Invalid key."
    sl.Text=msg
    sl.TextColor3=Color3.fromRGB(200,60,60)
    sb.Text="Verify Key"
    sb.BackgroundColor3=Color3.fromRGB(24,22,38)
    return
  end
  if _ok2 then blur:Destroy() end
  sg:Destroy()
  local fn,le=loadstring(_r.s)
  if not fn then
    warn("[Luvenn] Error: "..tostring(le))
    return
  end
  fn()
end)`;
}
