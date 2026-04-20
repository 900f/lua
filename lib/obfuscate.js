import { customAlphabet } from 'nanoid';

const hex32   = customAlphabet('abcdef0123456789', 32);
const alnum40 = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 40);
const tok24   = customAlphabet('abcdef0123456789', 24);

export const generateLoaderKey      = () => hex32();
export const generateScriptKey      = () => alnum40();
export const generateKeySystemToken = () => tok24();

// Build a clean, robust loader script with NO bitwise ops
// Security comes from: HTTPS, 32-char hex key, server-side validation
export function buildLoaderScript(loaderKey, siteUrl, keyProtected, useKeySystem) {
  const base    = siteUrl.replace(/\/$/, '');
  const execUrl = `${base}/api/loader/${loaderKey}/exec`;
  const tokUrl  = `${base}/api/key-system/token?key=${loaderKey}`;

  // Shared preamble - works in ALL Roblox executor contexts
  const pre = `local HS  = game:GetService("HttpService")
local PLS = game:GetService("Players")
local LP  = PLS.LocalPlayer
local _n  = (LP and LP.Name) or "Server"
local _h  = ""
pcall(function()
  _h = tostring(game:GetService("RbxAnalyticsService"):GetClientId()):gsub("-",""):upper()
end)

local function _req(url, body)
  -- Build URL with query parameters for GET request
  local params = {}
  for k, v in pairs(body) do
    table.insert(params, k .. "=" .. tostring(v))
  end
  local fullUrl = url .. "?" .. table.concat(params, "&")
  
  local ok, res = pcall(function()
    return HS:HttpGet(fullUrl)
  end)
  
  if not ok or not res then return nil end
  
  local ok2, data = pcall(function() return HS:JSONDecode(res) end)
  if not ok2 then return nil end
  return data
end
  
  -- Fallback to HttpGet (GET only, so need to restructure)
  if HS.HttpGet then
    local urlWithParams = url .. "?data=" .. HS:JSONEncode(body)
    ok, res = pcall(function() return HS:HttpGet(urlWithParams) end)
    if ok and res then
      local ok2, data = pcall(function() return HS:JSONDecode(res) end)
      if ok2 then return data end
    end
  end
  
  return nil
end`;

  // ── OPEN (no key) ─────────────────────────────────────────────────────────
  if (!keyProtected && !useKeySystem) {
    return `${pre}

local result = _req("${execUrl}", {n = _n, h = _h})
if not result or not result.s then
  error("[Luvenn] " .. ((result and result.e) or "Unavailable"), 2)
end
local fn, err = loadstring(result.s)
if not fn then
  error("[Luvenn] Script error: " .. tostring(err), 2)
end
local ok, runErr = pcall(fn)
if not ok then
  warn("[Luvenn] " .. tostring(runErr))
end`;
  }

  // ── KEY PROTECTED ─────────────────────────────────────────────────────────
  if (keyProtected && !useKeySystem) {
    return `${pre}

if not script_key then
  error("[Luvenn] Set script_key before this loadstring.", 2)
end
local result = _req("${execUrl}", {k = script_key, n = _n, h = _h})
if not result or not result.s then
  error("[Luvenn] " .. ((result and result.e) or "Unauthorized"), 2)
end
local fn, err = loadstring(result.s)
if not fn then
  error("[Luvenn] Script error: " .. tostring(err), 2)
end
local ok, runErr = pcall(fn)
if not ok then
  warn("[Luvenn] " .. tostring(runErr))
end`;
  }

  // ── KEY SYSTEM (in-game UI) ───────────────────────────────────────────────
  return `${pre}

if not LP then
  warn("[Luvenn] Key system requires a LocalScript.")
  return
end

-- Fetch key page URL once
local td = _req("${tokUrl}", {n = _n, h = _h})
local keyUrl = ""
local fetchFailed = false

if not td then
  fetchFailed = true
elseif not td.url then
  fetchFailed = true
else
  keyUrl = td.url
end

local sg = Instance.new("ScreenGui")
sg.Name = "Luvenn_" .. tostring(math.random(10000, 99999))
sg.ResetOnSpawn = false
sg.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
sg.IgnoreGuiInset = true
local parented = pcall(function() sg.Parent = game:GetService("CoreGui") end)
if not parented then sg.Parent = LP.PlayerGui end

local fr = Instance.new("Frame", sg)
fr.Size = UDim2.fromOffset(400, 265)
fr.Position = UDim2.new(0.5, -200, 0.5, -132)
fr.BackgroundColor3 = Color3.fromRGB(11, 9, 16)
fr.BorderSizePixel = 0
fr.Active = true
fr.Draggable = true
Instance.new("UICorner", fr).CornerRadius = UDim.new(0, 14)

local stroke = Instance.new("UIStroke", fr)
stroke.Color = Color3.fromRGB(100, 60, 200)
stroke.Thickness = 1.5
stroke.Transparency = 0.3

-- Header
local hdr = Instance.new("Frame", fr)
hdr.Size = UDim2.new(1, 0, 0, 46)
hdr.BackgroundColor3 = Color3.fromRGB(16, 14, 24)
hdr.BorderSizePixel = 0
Instance.new("UICorner", hdr).CornerRadius = UDim.new(0, 14)
local hdrFix = Instance.new("Frame", hdr)
hdrFix.Size = UDim2.new(1, 0, 0.5, 0)
hdrFix.Position = UDim2.new(0, 0, 0.5, 0)
hdrFix.BackgroundColor3 = Color3.fromRGB(16, 14, 24)
hdrFix.BorderSizePixel = 0

local title = Instance.new("TextLabel", hdr)
title.Size = UDim2.new(1, -50, 1, 0)
title.Position = UDim2.fromOffset(14, 0)
title.BackgroundTransparency = 1
title.Text = "Luvenn  —  Key Required"
title.TextColor3 = Color3.fromRGB(185, 165, 255)
title.Font = Enum.Font.GothamBold
title.TextSize = 13
title.TextXAlignment = Enum.TextXAlignment.Left

local closeBtn = Instance.new("TextButton", hdr)
closeBtn.Size = UDim2.fromOffset(26, 26)
closeBtn.Position = UDim2.new(1, -36, 0.5, -13)
closeBtn.BackgroundColor3 = Color3.fromRGB(32, 28, 48)
closeBtn.Text = "x"
closeBtn.TextColor3 = Color3.fromRGB(150, 135, 195)
closeBtn.Font = Enum.Font.GothamBold
closeBtn.TextSize = 12
closeBtn.BorderSizePixel = 0
Instance.new("UICorner", closeBtn).CornerRadius = UDim.new(0, 6)
closeBtn.MouseButton1Click:Connect(function() sg:Destroy() end)

-- Subtitle
local sub = Instance.new("TextLabel", fr)
sub.Size = UDim2.new(1, -28, 0, 26)
sub.Position = UDim2.fromOffset(14, 52)
sub.BackgroundTransparency = 1
sub.Text = "Get a key from the link, then paste it below to continue."
sub.TextColor3 = Color3.fromRGB(100, 88, 140)
sub.Font = Enum.Font.Gotham
sub.TextSize = 11
sub.TextXAlignment = Enum.TextXAlignment.Left
sub.TextWrapped = true

-- Copy link button
local copyBtn = Instance.new("TextButton", fr)
copyBtn.Size = UDim2.new(1, -28, 0, 38)
copyBtn.Position = UDim2.fromOffset(14, 82)
copyBtn.BackgroundColor3 = Color3.fromRGB(88, 48, 180)
copyBtn.Text = (keyUrl ~= "") and "Copy Key Link" or "Loading..."
copyBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
copyBtn.Font = Enum.Font.GothamBold
copyBtn.TextSize = 13
copyBtn.BorderSizePixel = 0
Instance.new("UICorner", copyBtn).CornerRadius = UDim.new(0, 9)
if keyUrl ~= "" then
  copyBtn.MouseButton1Click:Connect(function()
    setclipboard(keyUrl)
    copyBtn.Text = "Copied!"
    task.delay(2, function()
      if copyBtn and copyBtn.Parent then copyBtn.Text = "Copy Key Link" end
    end)
  end)
end

-- Divider
local div = Instance.new("Frame", fr)
div.Size = UDim2.new(1, -28, 0, 1)
div.Position = UDim2.fromOffset(14, 132)
div.BackgroundColor3 = Color3.fromRGB(32, 28, 48)
div.BorderSizePixel = 0

-- Key input
local keyBox = Instance.new("TextBox", fr)
keyBox.Size = UDim2.new(1, -28, 0, 38)
keyBox.Position = UDim2.fromOffset(14, 141)
keyBox.BackgroundColor3 = Color3.fromRGB(18, 16, 28)
keyBox.Text = ""
keyBox.PlaceholderText = "Paste your key here..."
keyBox.TextColor3 = Color3.fromRGB(210, 200, 235)
keyBox.PlaceholderColor3 = Color3.fromRGB(70, 60, 105)
keyBox.Font = Enum.Font.Code
keyBox.TextSize = 11
keyBox.ClearTextOnFocus = false
keyBox.BorderSizePixel = 0
Instance.new("UICorner", keyBox).CornerRadius = UDim.new(0, 8)
local keyStroke = Instance.new("UIStroke", keyBox)
keyStroke.Color = Color3.fromRGB(60, 48, 105)
keyStroke.Thickness = 1

-- Status label
local status = Instance.new("TextLabel", fr)
status.Size = UDim2.new(1, -28, 0, 16)
status.Position = UDim2.fromOffset(14, 184)
status.BackgroundTransparency = 1
status.Text = ""
status.TextColor3 = Color3.fromRGB(95, 82, 132)
status.Font = Enum.Font.Gotham
status.TextSize = 11
status.TextXAlignment = Enum.TextXAlignment.Left

-- Submit button
local submitBtn = Instance.new("TextButton", fr)
submitBtn.Size = UDim2.new(1, -28, 0, 36)
submitBtn.Position = UDim2.fromOffset(14, 206)
submitBtn.BackgroundColor3 = Color3.fromRGB(24, 22, 38)
submitBtn.Text = "Verify Key"
submitBtn.TextColor3 = Color3.fromRGB(185, 175, 220)
submitBtn.Font = Enum.Font.GothamBold
submitBtn.TextSize = 13
submitBtn.BorderSizePixel = 0
Instance.new("UICorner", submitBtn).CornerRadius = UDim.new(0, 9)
local submitStroke = Instance.new("UIStroke", submitBtn)
submitStroke.Color = Color3.fromRGB(60, 48, 105)
submitStroke.Thickness = 1

submitBtn.MouseButton1Click:Connect(function()
  local k = keyBox.Text:match("^%s*(.-)%s*$")
  if #k < 8 then
    status.Text = "Key too short."
    status.TextColor3 = Color3.fromRGB(200, 60, 60)
    return
  end
  submitBtn.Text = "Checking..."
  submitBtn.BackgroundColor3 = Color3.fromRGB(16, 14, 26)
  status.Text = "Verifying..."
  status.TextColor3 = Color3.fromRGB(95, 82, 132)

  local getUrl = "${execUrl}?k=" .. k .. "&n=" .. _n .. "&h=" .. _h
  
  local ok, res = pcall(function()
    return HS:HttpGet(getUrl)
  end)
  
  if not ok or not res then
    status.Text = "Connection failed."
    status.TextColor3 = Color3.fromRGB(200, 60, 60)
    submitBtn.Text = "Verify Key"
    submitBtn.BackgroundColor3 = Color3.fromRGB(24, 22, 38)
    return
  end
  
  local ok2, r = pcall(function() return HS:JSONDecode(res) end)
  if not ok2 or not r then
    status.Text = "Invalid response."
    status.TextColor3 = Color3.fromRGB(200, 60, 60)
    submitBtn.Text = "Verify Key"
    submitBtn.BackgroundColor3 = Color3.fromRGB(24, 22, 38)
    return
  end
  
  if not r.s then
    status.Text = r.e or "Invalid key."
    status.TextColor3 = Color3.fromRGB(200, 60, 60)
    submitBtn.Text = "Verify Key"
    submitBtn.BackgroundColor3 = Color3.fromRGB(24, 22, 38)
    return
  end

  sg:Destroy()
  local fn, lerr = loadstring(r.s)
  if not fn then
    warn("[Luvenn] Script error: " .. tostring(lerr))
    return
  end
  local ok, runErr = pcall(fn)
  if not ok then
    warn("[Luvenn] " .. tostring(runErr))
  end
end)`;
}
