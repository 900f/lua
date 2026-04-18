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

// Builds the tiny .lua loader - actual script content never included
export function buildLoaderScript(loaderKey, siteUrl, keyProtected, useKeySystem) {
  const base = siteUrl.replace(/\/$/, '');

  if (useKeySystem) {
    return `-- LuaVault Protected Script
local HS = game:GetService("HttpService")
local LP = game:GetService("Players").LocalPlayer
local TW = game:GetService("TweenService")
local UIS = game:GetService("UserInputService")
local SITE = "https://luavault-dun.vercel.app"
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

-- Fetch key page link
linkBtn.MouseButton1Click:Connect(function()
    linkBtn.Text = "Loading..."

    local res = HS:RequestAsync({
        Url = SITE .. "/api/key-system/token",
        Method = "POST",
        Headers = {
            ["Content-Type"] = "application/json"
        },
        Body = HS:JSONEncode({
            key = "${loaderKey}",
            n = tostring(_n),
            h = tostring(_h)
        })
    })

    print("STATUS:", res.StatusCode)
    print("BODY:", res.Body)

    if not res.Success then
        linkBtn.Text = "Failed"
        warn("HTTP failed:", res.StatusMessage)
        return
    end

    local ok, data = pcall(function()
        return HS:JSONDecode(res.Body)
    end)

    if not ok then
        linkBtn.Text = "Bad Response"
        warn("JSON error:", res.Body)
        return
    end

    if not data.url then
        linkBtn.Text = "No Link"
        warn("No URL returned:", res.Body)
        return
    end

    setclipboard(data.url)

    linkBtn.Text = "Copied!"
    task.delay(2, function()
        linkBtn.Text = "Get Key"
    end)
end)

-- Fixed submit button handler
submitBtn.MouseButton1Click:Connect(function()
    local k = keyBox.Text:match("^%s*(.-)%s*$")
    if #k < 8 then
        submitBtn.Text = "Key too short"
        task.delay(2, function() submitBtn.Text = "Submit Key" end)
        return
    end

    submitBtn.Text = "Checking..."
    submitBtn.Active = false

    local success, err = pcall(function()
        local r = HS:RequestAsync({
            Url = "${base}/api/loader/${loaderKey}/exec",
            Method = "POST",
            Headers = {["Content-Type"] = "application/json"},
            Body = HS:JSONEncode({k = k, n = _n, h = _h})
        })

        if not r.Success then
            error("HTTP " .. (r.StatusCode or "???") .. ": " .. (r.StatusMessage or "Unknown error"))
        end

        local d = HS:JSONDecode(r.Body)

        if not d.s then
            error(d.e or "Invalid key")
        end

        -- Critical fix: loadstring BEFORE calling fn()
        local fn, le = loadstring(d.s)
        if not fn then
            error("Loadstring failed: " .. tostring(le))
        end

        -- Close UI safely
        pcall(function() sg:Destroy() end)

        print("LuaVault: Key accepted - executing protected script")
        fn()   -- Safe to call now
    end)

    if not success then
        submitBtn.Text = tostring(err):sub(1, 40)
        warn("[LuaVault Key System] Error:", err)
        task.delay(4, function()
            if submitBtn and submitBtn.Parent then
                submitBtn.Text = "Submit Key"
                submitBtn.Active = true
            end
        end)
    end
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
local ok,err=pcall(function()
  local r=HS:RequestAsync({Url="${base}/api/loader/${loaderKey}/exec",Method="POST",Headers={["Content-Type"]="application/json"},Body=HS:JSONEncode({k=script_key,n=_n,h=_h})})
  if not r.Success then error(r.StatusMessage) end
  local d=HS:JSONDecode(r.Body)
  if not d.s then error(d.e or"Unauthorized") end
  local fn,le=loadstring(d.s)
  if not fn then error(le) end
  fn()
end)
if not ok then warn("[LuaVault] "..tostring(err)) end`;
  }

  return `-- LuaVault Protected Script
local HS=game:GetService("HttpService")
local LP=game:GetService("Players").LocalPlayer
local _n=LP and LP.Name or"Unknown"
local ok,err=pcall(function()
  local r=HS:RequestAsync({Url="${base}/api/loader/${loaderKey}/exec",Method="POST",Headers={["Content-Type"]="application/json"},Body=HS:JSONEncode({n=_n})})
  if not r.Success then error(r.StatusMessage) end
  local d=HS:JSONDecode(r.Body)
  if not d.s then error(d.e or"Unavailable") end
  local fn,le=loadstring(d.s)
  if not fn then error(le) end
  fn()
end)
if not ok then warn("[LuaVault] "..tostring(err)) end`;
}