// Updated loader using HttpGet instead of PostAsync
export function buildLoaderScript(loaderKey, siteUrl, keyProtected, useKeySystem) {
  const base = siteUrl.replace(/\/$/, '');

  if (useKeySystem) {
    return `-- LuaVault Protected Script
local HS = game:GetService("HttpService")
local LP = game:GetService("Players").LocalPlayer
local _n = LP and LP.Name or "Unknown"
local _h = ""
pcall(function() _h = tostring(game:GetService("RbxAnalyticsService"):GetClientId()):gsub("-",""):upper() end)

-- Helper function to make GET requests (works in more executors)
local function httpGet(url)
    local success, result = pcall(function()
        return game:HttpGet(url, true)
    end)
    if not success then
        error("HTTP request failed: " .. tostring(result))
    end
    return result
end

-- Helper for POST requests using GET with data in URL (hacky but works)
local function httpPost(url, data)
    local encoded = HS:JSONEncode(data)
    local fullUrl = url .. "?data=" .. HS:URLEncode(encoded)
    return httpGet(fullUrl)
end

-- Key system UI (same as before)
local sg = Instance.new("ScreenGui", game.CoreGui)
sg.Name = "LV_"..math.random(1000,9999)
sg.ResetOnSpawn = false

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

-- Get token URL
linkBtn.MouseButton1Click:Connect(function()
    linkBtn.Text = "Loading..."
    
    local url = "${base}/api/key-system/token?key=${loaderKey}&n=" .. HS:URLEncode(_n) .. "&h=" .. HS:URLEncode(_h)
    
    local success, response = pcall(function()
        return game:HttpGet(url, true)
    end)
    
    if not success then
        linkBtn.Text = "Failed"
        return
    end
    
    local ok, data = pcall(function()
        return HS:JSONDecode(response)
    end)
    
    if ok and data.url then
        pcall(function()
            if setclipboard then setclipboard(data.url) end
        end)
        linkBtn.Text = "Copied!"
        task.delay(2, function() linkBtn.Text = "Get Key" end)
    else
        linkBtn.Text = "Error"
        task.delay(2, function() linkBtn.Text = "Get Key" end)
    end
end)

-- Submit key
submitBtn.MouseButton1Click:Connect(function()
    local k = keyBox.Text:match("^%s*(.-)%s*$")
    if #k < 8 then
        submitBtn.Text = "Key too short"
        task.delay(2, function() submitBtn.Text = "Submit Key" end)
        return
    end
    
    submitBtn.Text = "Checking..."
    submitBtn.Active = false
    
    local url = "${base}/api/loader/${loaderKey}/exec?k=" .. HS:URLEncode(k) .. "&n=" .. HS:URLEncode(_n) .. "&h=" .. HS:URLEncode(_h)
    
    local success, response = pcall(function()
        return game:HttpGet(url, true)
    end)
    
    if not success then
        submitBtn.Text = "Request Failed"
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
        return
    end
    
    pcall(function() sg:Destroy() end)
    fn()
end)`;
  }

  // Similar for other protection modes...
  return `-- LuaVault Protected Script
local HS = game:GetService("HttpService")
local LP = game:GetService("Players").LocalPlayer
local _n = LP and LP.Name or "Unknown"

local url = "${base}/api/loader/${loaderKey}/exec?n=" .. HS:URLEncode(_n)

local success, response = pcall(function()
    return game:HttpGet(url, true)
end)

if success then
    local ok, d = pcall(function() return HS:JSONDecode(response) end)
    if ok and d.s then
        local fn, le = loadstring(d.s)
        if fn then fn() end
    end
end`;
}