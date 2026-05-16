package controller

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"yiapi/relay/adaptor/openai"
)

type openAIModel struct {
	ID     string `json:"id"`
	Object string `json:"object"`
}

type openAIModelList struct {
	Object string         `json:"object"`
	Data   []openAIModel  `json:"data"`
}

func FetchChannelModels(c *gin.Context) {
	var req struct {
		Type    int    `json:"type"`
		Key     string `json:"key"`
		BaseURL string `json:"base_url"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "参数错误"})
		return
	}

	// For OpenAI-compatible channels (type 1=OpenAI, 50=OpenAI compatible)
	if req.Type == 1 || req.Type == 50 {
		baseURL := strings.TrimRight(req.BaseURL, "/")
		if baseURL == "" {
			baseURL = "https://api.openai.com"
		}
		modelsURL := fmt.Sprintf("%s/v1/models", baseURL)

		client := &http.Client{}
		httpReq, err := http.NewRequest("GET", modelsURL, nil)
		if err != nil {
			c.JSON(http.StatusOK, gin.H{"success": false, "message": "创建请求失败"})
			return
		}
		httpReq.Header.Set("Authorization", "Bearer "+req.Key)

		resp, err := client.Do(httpReq)
		if err != nil {
			c.JSON(http.StatusOK, gin.H{"success": false, "message": "连接上游失败: " + err.Error()})
			return
		}
		defer resp.Body.Close()

		body, _ := io.ReadAll(resp.Body)
		if resp.StatusCode != http.StatusOK {
			c.JSON(http.StatusOK, gin.H{"success": false, "message": fmt.Sprintf("上游返回 %d: %s", resp.StatusCode, string(body))})
			return
		}

		var modelList openAIModelList
		if err := json.Unmarshal(body, &modelList); err != nil {
			c.JSON(http.StatusOK, gin.H{"success": false, "message": "解析响应失败"})
			return
		}

		models := make([]string, 0, len(modelList.Data))
		for _, m := range modelList.Data {
			if m.Object == "model" {
				models = append(models, m.ID)
			}
		}

		c.JSON(http.StatusOK, gin.H{"success": true, "data": models})
		return
	}

	// For other channel types, return static model list
	var models []string
	switch req.Type {
	case 14: // Anthropic
		models = []string{"claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307", "claude-3-5-sonnet-20240620"}
	case 15: // Baidu
		models = []string{"ERNIE-4.0-8K", "ERNIE-3.5-8K", "ERNIE-Speed-8K", "ERNIE-Lite-8K"}
	case 17: // Alibaba
		models = []string{"qwen-turbo", "qwen-plus", "qwen-max", "qwen-long"}
	case 8, 5: // Zhipu/ChatGLM
		models = []string{"glm-4", "glm-4v", "glm-3-turbo"}
	case 24: // Gemini
		models = []string{"gemini-pro", "gemini-pro-vision", "gemini-1.5-pro", "gemini-1.5-flash"}
	case 3: // Azure
		models = []string{"gpt-4", "gpt-4-32k", "gpt-4-turbo", "gpt-35-turbo"}
	default:
		models = openai.ModelList
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": models})
}
