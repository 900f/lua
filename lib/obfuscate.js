import { customAlphabet } from 'nanoid';

const hexAlpha = customAlphabet('abcdef0123456789', 32);
const keyAlpha = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 40);
const tokenAlpha = customAlphabet('abcdef0123456789', 24);

export function generateLoaderKey() { return hexAlpha(); }
export function generateScriptKey() { return keyAlpha(); }
export function generateKeySystemToken() { return tokenAlpha(); }

export function buildLoaderScript(loaderKey, siteUrl, keyProtected, useKeySystem) {
  const base = siteUrl.replace(/\/$/, '');

  // Shared fetch helper - works in both LocalScript and Script contexts
  // Uses HttpService:RequestAsync which works server-side, and game:HttpGet in local
  const fetchHelper = `
local function _lvFetch(url, method, body)
  local HS = game:GetService("HttpService")
  if method == "POST" then
    local ok, res = pcall(function()
      return HS:RequestAsync({
        Url = url, Method = "POST",
        Headers = {["Content-Type"] = "application/json"},
        Body = body
      })
    end)
    if ok and res then return res end
    return nil
  else
    local ok, res = pcall(function() return HS:GetAsync(url, true) end)
    if ok then return { Success = true, Body = res } end
    return nil
  end
end`;

  if (useKeySystem) {
    return `-- LuaVault Protected Script
local Players = game:GetService("Players")
local HS = game:GetService("HttpService")
local LP = Players.LocalPlayer
if not LP then warn("[LuaVault] Key system requires a LocalScript") return end

local _n = LP.Name
local _h = ""
pcall(function() _h = tostring(game:GetService("RbxAnalyticsService"):GetClientId()):gsub("-",""):upper() end)
${fetchHelper}

-- Fetch key page URL
local _tokenRes = _lvFetch("${base}/api/key-system/token", "POST",
  HS:JSONEncode({key="${loaderKey}", n=_n, h=_h}))
local _keyUrl = ""
if _tokenRes and _tokenRes.Success then
  local ok, d = pcall(function() return HS:JSONDecode(_tokenRes.Body) end)
  if ok and d and d.url then _keyUrl = d.url end
end

-- Build UI
local sg = Instance.new("ScreenGui")
sg.Name = "LV"..math.random(1e4,9e4)
sg.ResetOnSpawn = false
sg.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
sg.IgnoreGuiInset = true
pcall(function() sg.Parent = game:GetService("CoreGui") end)
if not sg.Parent then sg.Parent = LP.PlayerGui end

local bg = Instance.new("Frame", sg)
bg.Size = UDim2.fromOffset(400,260)
bg.Position = UDim2.new(0.5,-200,0.5,-130)
bg.BackgroundColor3 = Color3.fromRGB(12,12,18)
bg.BorderSizePixel = 0
bg.ClipsDescendants = true
Instance.new("UICorner",bg).CornerRadius = UDim.new(0,14)

local accent = Color3.fromRGB(224,82,154)

-- Top bar
local topBar = Instance.new("Frame",bg)
topBar.Size = UDim2.new(1,0,0,48)
topBar.BackgroundColor3 = Color3.fromRGB(20,20,30)
topBar.BorderSizePixel = 0

local title = Instance.new("TextLabel",topBar)
title.Size = UDim2.new(1,-16,1,0)
title.Position = UDim2.fromOffset(16,0)
title.BackgroundTransparency = 1
title.Text = "Script Key Required"
title.TextColor3 = Color3.fromRGB(240,240,250)
title.Font = Enum.Font.GothamBold
title.TextSize = 15
title.TextXAlignment = Enum.TextXAlignment.Left

local closeBtn = Instance.new("TextButton",topBar)
closeBtn.Size = UDim2.fromOffset(32,32)
closeBtn.Position = UDim2.new(1,-40,0.5,-16)
closeBtn.BackgroundColor3 = Color3.fromRGB(40,40,55)
closeBtn.Text = "X"
closeBtn.TextColor3 = Color3.fromRGB(180,170,200)
closeBtn.Font = Enum.Font.GothamBold
closeBtn.TextSize = 13
closeBtn.BorderSizePixel = 0
Instance.new("UICorner",closeBtn).CornerRadius = UDim.new(0,6)
closeBtn.MouseButton1Click:Connect(function() sg:Destroy() end)

local sub = Instance.new("TextLabel",bg)
sub.Size = UDim2.new(1,-32,0,32)
sub.Position = UDim2.fromOffset(16,58)
sub.BackgroundTransparency = 1
sub.TextColor3 = Color3.fromRGB(140,130,160)
sub.Font = Enum.Font.Gotham
sub.TextSize = 12
sub.TextWrapped = true
sub.TextXAlignment = Enum.TextXAlignment.Left
sub.Text = "Complete the tasks at the link below, then paste your key here."

-- Key link button
local linkBtn = Instance.new("TextButton",bg)
linkBtn.Size = UDim2.new(1,-32,0,38)
linkBtn.Position = UDim2.fromOffset(16,100)
linkBtn.BackgroundColor3 = accent
linkBtn.Text = _keyUrl ~= "" and "Copy Key Link" or "Fetching link..."
linkBtn.TextColor3 = Color3.fromRGB(255,255,255)
linkBtn.Font = Enum.Font.GothamBold
linkBtn.TextSize = 13
linkBtn.BorderSizePixel = 0
Instance.new("UICorner",linkBtn).CornerRadius = UDim.new(0,8)
if _keyUrl ~= "" then
  linkBtn.MouseButton1Click:Connect(function()
    setclipboard(_keyUrl)
    linkBtn.Text = "Copied!"
    task.delay(2, function() if linkBtn then linkBtn.Text = "Copy Key Link" end end)
  end)
end

-- Key input
local keyBox = Instance.new("TextBox",bg)
keyBox.Size = UDim2.new(1,-32,0,38)
keyBox.Position = UDim2.fromOffset(16,150)
keyBox.BackgroundColor3 = Color3.fromRGB(24,24,36)
keyBox.Text = ""
keyBox.PlaceholderText = "Paste your key here..."
keyBox.TextColor3 = Color3.fromRGB(220,215,235)
keyBox.PlaceholderColor3 = Color3.fromRGB(90,80,110)
keyBox.Font = Enum.Font.Code
keyBox.TextSize = 12
keyBox.ClearTextOnFocus = false
keyBox.BorderSizePixel = 0
Instance.new("UICorner",keyBox).CornerRadius = UDim.new(0,8)

-- Status label
local statusLbl = Instance.new("TextLabel",bg)
statusLbl.Size = UDim2.new(1,-32,0,20)
statusLbl.Position = UDim2.fromOffset(16,196)
statusLbl.BackgroundTransparency = 1
statusLbl.TextColor3 = Color3.fromRGB(120,110,145)
statusLbl.Font = Enum.Font.Gotham
statusLbl.TextSize = 11
statusLbl.TextXAlignment = Enum.TextXAlignment.Left
statusLbl.Text = ""

-- Submit button
local submitBtn = Instance.new("TextButton",bg)
submitBtn.Size = UDim2.new(1,-32,0,36)
submitBtn.Position = UDim2.fromOffset(16,220)
submitBtn.BackgroundColor3 = Color3.fromRGB(30,30,45)
submitBtn.Text = "Verify Key"
submitBtn.TextColor3 = Color3.fromRGB(200,195,220)
submitBtn.Font = Enum.Font.GothamBold
submitBtn.TextSize = 13
submitBtn.BorderSizePixel = 0
Instance.new("UICorner",submitBtn).CornerRadius = UDim.new(0,8)

submitBtn.MouseButton1Click:Connect(function()
  local k = keyBox.Text:match("^%s*(.-)%s*$")
  if #k < 8 then statusLbl.Text = "Key is too short." statusLbl.TextColor3 = Color3.fromRGB(220,80,80) return end
  submitBtn.Text = "Verifying..."
  submitBtn.BackgroundColor3 = Color3.fromRGB(25,25,38)
  statusLbl.Text = "Checking key..."
  statusLbl.TextColor3 = Color3.fromRGB(120,110,145)

  local res = _lvFetch("${base}/api/loader/${loaderKey}/exec", "POST",
    HS:JSONEncode({k=k, n=_n, h=_h}))

  if not res or not res.Success then
    statusLbl.Text = "Connection failed."
    statusLbl.TextColor3 = Color3.fromRGB(220,80,80)
    submitBtn.Text = "Verify Key"
    submitBtn.BackgroundColor3 = Color3.fromRGB(30,30,45)
    return
  end

  local ok2, d = pcall(function() return HS:JSONDecode(res.Body) end)
  if not ok2 or not d or not d.s then
    local msg = (ok2 and d and d.e) or "Invalid key."
    statusLbl.Text = msg
    statusLbl.TextColor3 = Color3.fromRGB(220,80,80)
    submitBtn.Text = "Verify Key"
    submitBtn.BackgroundColor3 = Color3.fromRGB(30,30,45)
    return
  end

  sg:Destroy()
  local fn, le = loadstring(d.s)
  if not fn then warn("[LuaVault] Load error: "..tostring(le)) return end
  fn()
end)`;
  }

  if (keyProtected) {
    return `-- LuaVault Protected Script
local HS = game:GetService("HttpService")
local Players = game:GetService("Players")
local _n = ""
pcall(function() _n = Players.LocalPlayer and Players.LocalPlayer.Name or "Server" end)
local _h = ""
pcall(function() _h = tostring(game:GetService("RbxAnalyticsService"):GetClientId()):gsub("-",""):upper() end)
${fetchHelper}
if not script_key then error("[LuaVault] script_key must be defined before this loadstring.",2) end
local res = _lvFetch("${base}/api/loader/${loaderKey}/exec","POST",
  HS:JSONEncode({k=script_key,n=_n,h=_h}))
if not res or not res.Success then error("[LuaVault] Connection failed.",2) end
local ok,d = pcall(function() return HS:JSONDecode(res.Body) end)
if not ok or not d or not d.s then error("[LuaVault] "..(ok and d and d.e or "Unauthorized"),2) end
local fn,le = loadstring(d.s)
if not fn then error("[LuaVault] "..tostring(le),2) end
fn()`;
  }

  return `-- LuaVault Protected Script
local HS = game:GetService("HttpService")
print("Trying to fetch: " .. url)
local res = pcall(function() return HS:GetAsync(url, true) end)
print("Result: ", res)
local Players = game:GetService("Players")
local _n = ""
pcall(function() _n = Players.LocalPlayer and Players.LocalPlayer.Name or "Server" end)
${fetchHelper}
local res = _lvFetch("${base}/api/loader/${loaderKey}/exec","POST",HS:JSONEncode({n=_n}))
if not res or not res.Success then error("[LuaVault] Connection failed.",2) end
local ok,d = pcall(function() return HS:JSONDecode(res.Body) end)
if not ok or not d or not d.s then error("[LuaVault] "..(ok and d and d.e or "Unavailable"),2) end
local fn,le = loadstring(d.s)
if not fn then error("[LuaVault] "..tostring(le),2) end
fn()`;
}
