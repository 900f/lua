import { customAlphabet } from 'nanoid';

// Short hex-style keys like luamor
const hexAlpha = customAlphabet('abcdef0123456789', 32);
const keyAlpha = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 40);

export function generateLoaderKey() {
  return hexAlpha(); // 32 char hex string
}

export function generateScriptKey() {
  return keyAlpha(); // 40 char alphanumeric, no dashes
}

export function generateKeySystemToken() {
  return customAlphabet('abcdef0123456789', 24)();
}

// Builds the tiny .lua loader - USING POSTASYNC (works in LocalScripts)
export function buildLoaderScript(loaderKey, siteUrl, keyProtected, useKeySystem) {
  const base = siteUrl.replace(/\/$/, '');

  if (useKeySystem) {
    return `-- LuaVault Protected Script
local HS = game:GetService("HttpService")
local LP = game:GetService("Players").LocalPlayer
local _n = LP and LP.Name or "Unknown"
local _h = ""
pcall(function() _h = tostring(game:GetService("RbxAnalyticsService"):GetClientId()):gsub("-",""):upper() end)

-- Key system UI
local sg = Instance.new("ScreenGui", game.CoreGui)
sg.Name = "LV_"..math.random(1000,9999)
sg.ResetOnSpawn = false
sg.ZIndexBehavior = Enum.ZIndexBehavior.Sibling

local frame = Instance.new("Frame", sg)
frame.Size = UDim2.new(0,380,0,220)
frame.Position = UDim2.new(0.5,-190,0.5,-110)
frame.BackgroundColor3 = Color3.fromRGB(15,15,20)
frame.BorderSizePixel = 0
Instance.new("UICorner", frame).CornerRadius = UDim.new(0,12)

local title = Instance.new("TextLabel", frame)
title.Size = UDim2.new(1,0,0,44)
title.BackgroundTransparency = 1
title.Text = "Script Key Required"
title.TextColor3 = Color3.fromRGB(240,240,245)
title.Font = Enum.Font.GothamBold
title.TextSize = 16

local sub = Instance.new("TextLabel", frame)
sub.Size = UDim2.new(1,-40,0,30)
sub.Position = UDim2.new(0,20,0,44)
sub.BackgroundTransparency = 1
sub.TextColor3 = Color3.fromRGB(140,130,160)
sub.Font = Enum.Font.Gotham
sub.TextSize = 13
sub.TextWrapped = true

local linkBtn = Instance.new("TextButton", frame)
linkBtn.Size = UDim2.new(1,-40,0,38)
linkBtn.Position = UDim2.new(0,20,0,84)
linkBtn.BackgroundColor3 = Color3.fromRGB(224,82,154)
linkBtn.Text = "Get Key"
linkBtn.TextColor3 = Color3.fromRGB(255,255,255)
linkBtn.Font = Enum.Font.GothamBold
linkBtn.TextSize = 14
linkBtn.BorderSizePixel = 0
Instance.new("UICorner", linkBtn).CornerRadius = UDim.new(0,8)

local keyBox = Instance.new("TextBox", frame)
keyBox.Size = UDim2.new(1,-40,0,38)
keyBox.Position = UDim2.new(0,20,0,134)
keyBox.BackgroundColor3 = Color3.fromRGB(28,28,38)
keyBox.Text = ""
keyBox.PlaceholderText = "Paste key here..."
keyBox.TextColor3 = Color3.fromRGB(220,220,230)
keyBox.Font = Enum.Font.Code
keyBox.TextSize = 13
keyBox.ClearTextOnFocus = false
keyBox.BorderSizePixel = 0
Instance.new("UICorner", keyBox).CornerRadius = UDim.new(0,8)

local submitBtn = Instance.new("TextButton", frame)
submitBtn.Size = UDim2.new(1,-40,0,36)
submitBtn.Position = UDim2.new(0,20,0,182)
submitBtn.BackgroundColor3 = Color3.fromRGB(40,40,55)
submitBtn.Text = "Submit Key"
submitBtn.TextColor3 = Color3.fromRGB(200,200,215)
submitBtn.Font = Enum.Font.GothamBold
submitBtn.TextSize = 13
submitBtn.BorderSizePixel = 0
Instance.new("UICorner", submitBtn).CornerRadius = UDim.new(0,8)

-- Fetch key page link (using PostAsync)
linkBtn.MouseButton1Click:Connect(function()
    linkBtn.Text = "Loading..."

    local body = HS:JSONEncode({
        key = "${loaderKey}",
        n = tostring(_n),
        h = tostring(_h)
    })
    
    local success, response = pcall(function()
        return HS:PostAsync("${base}/api/key-system/token", body, Enum.HttpContentType.ApplicationJson, false)
    end)

    if not success then
        linkBtn.Text = "Failed"
        warn("Request failed:", response)
        return
    end

    local ok, data = pcall(function()
        return HS:JSONDecode(response)
    end)

    if not ok or not data.url then
        linkBtn.Text = "No Link"
        warn("No URL returned:", response)
        return
    end

    pcall(function()
        if setclipboard then
            setclipboard(data.url)
        end
    end)

    linkBtn.Text = "Copied!"
    task.delay(2, function()
        linkBtn.Text = "Get Key"
    end)
end)

-- Submit button (using PostAsync)
submitBtn.MouseButton1Click:Connect(function()
    local k = keyBox.Text:match("^%s*(.-)%s*$")
    if #k < 8 then
        submitBtn.Text = "Key too short"
        task.delay(2, function() submitBtn.Text = "Submit Key" end)
        return
    end

    submitBtn.Text = "Checking..."
    submitBtn.Active = false

    local body = HS:JSONEncode({k = k, n = _n, h = _h})
    
    local success, response = pcall(function()
        return HS:PostAsync("${base}/api/loader/${loaderKey}/exec", body, Enum.HttpContentType.ApplicationJson, false)
    end)

    if not success then
        submitBtn.Text = "Request Failed"
        warn("[LuaVault] Request error:", response)
        task.delay(3, function()
            if submitBtn and submitBtn.Parent then
                submitBtn.Text = "Submit Key"
                submitBtn.Active = true
            end
        end)
        return
    end

    local ok, d = pcall(function()
        return HS:JSONDecode(response)
    end)

    if not ok or not d.s then
        submitBtn.Text = d and d.e or "Invalid key"
        task.delay(3, function()
            if submitBtn and submitBtn.Parent then
                submitBtn.Text = "Submit Key"
                submitBtn.Active = true
            end
        end)
        return
    end

    local fn, le = loadstring(d.s)
    if not fn then
        submitBtn.Text = "Load error"
        warn(le)
        return
    end

    pcall(function() sg:Destroy() end)
    print("LuaVault: Key accepted - executing protected script")
    fn()
end)`;
  }

  if (keyProtected) {
    return `-- LuaVault Protected Script
if not script_key then error("[LuaVault] script_key required",2) end
local HS=game:GetService("HttpService")
local LP=game:GetService("Players").LocalPlayer
local _n=LP and LP.Name or"Unknown"
local _h=""
pcall(function() _h=tostring(game:GetService("RbxAnalyticsService"):GetClientId()):gsub("-",""):upper() end)

local body = HS:JSONEncode({k=script_key, n=_n, h=_h})
local success, response = pcall(function()
    return HS:PostAsync("${base}/api/loader/${loaderKey}/exec", body, Enum.HttpContentType.ApplicationJson, false)
end)

if not success then
    warn("[LuaVault] Request failed:", response)
    return
end

local ok, d = pcall(function() return HS:JSONDecode(response) end)
if not ok or not d.s then
    warn("[LuaVault] " .. (d and d.e or "Unauthorized"))
    return
end

local fn, le = loadstring(d.s)
if not fn then
    warn("[LuaVault] " .. tostring(le))
    return
end
fn()`;
  }

  // Open script (no protection)
  return `-- LuaVault Protected Script
local HS=game:GetService("HttpService")
local LP=game:GetService("Players").LocalPlayer
local _n=LP and LP.Name or"Unknown"

local body = HS:JSONEncode({n=_n})
local success, response = pcall(function()
    return HS:PostAsync("${base}/api/loader/${loaderKey}/exec", body, Enum.HttpContentType.ApplicationJson, false)
end)

if not success then
    warn("[LuaVault] Request failed:", response)
    return
end

local ok, d = pcall(function() return HS:JSONDecode(response) end)
if not ok or not d.s then
    warn("[LuaVault] " .. (d and d.e or "Unavailable"))
    return
end

local fn, le = loadstring(d.s)
if not fn then
    warn("[LuaVault] " .. tostring(le))
    return
end
fn()`;
}