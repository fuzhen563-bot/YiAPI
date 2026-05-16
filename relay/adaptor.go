package relay

import (
	"yiapi/relay/adaptor"
	"yiapi/relay/adaptor/aiproxy"
	"yiapi/relay/adaptor/ali"
	"yiapi/relay/adaptor/anthropic"
	"yiapi/relay/adaptor/aws"
	"yiapi/relay/adaptor/baidu"
	"yiapi/relay/adaptor/cloudflare"
	"yiapi/relay/adaptor/cohere"
	"yiapi/relay/adaptor/coze"
	"yiapi/relay/adaptor/deepl"
	"yiapi/relay/adaptor/gemini"
	"yiapi/relay/adaptor/ollama"
	"yiapi/relay/adaptor/openai"
	"yiapi/relay/adaptor/palm"
	"yiapi/relay/adaptor/proxy"
	"yiapi/relay/adaptor/replicate"
	"yiapi/relay/adaptor/tencent"
	"yiapi/relay/adaptor/vertexai"
	"yiapi/relay/adaptor/xunfei"
	"yiapi/relay/adaptor/zhipu"
	"yiapi/relay/apitype"
)

func GetAdaptor(apiType int) adaptor.Adaptor {
	switch apiType {
	case apitype.AIProxyLibrary:
		return &aiproxy.Adaptor{}
	case apitype.Ali:
		return &ali.Adaptor{}
	case apitype.Anthropic:
		return &anthropic.Adaptor{}
	case apitype.AwsClaude:
		return &aws.Adaptor{}
	case apitype.Baidu:
		return &baidu.Adaptor{}
	case apitype.Gemini:
		return &gemini.Adaptor{}
	case apitype.OpenAI:
		return &openai.Adaptor{}
	case apitype.PaLM:
		return &palm.Adaptor{}
	case apitype.Tencent:
		return &tencent.Adaptor{}
	case apitype.Xunfei:
		return &xunfei.Adaptor{}
	case apitype.Zhipu:
		return &zhipu.Adaptor{}
	case apitype.Ollama:
		return &ollama.Adaptor{}
	case apitype.Coze:
		return &coze.Adaptor{}
	case apitype.Cohere:
		return &cohere.Adaptor{}
	case apitype.Cloudflare:
		return &cloudflare.Adaptor{}
	case apitype.DeepL:
		return &deepl.Adaptor{}
	case apitype.VertexAI:
		return &vertexai.Adaptor{}
	case apitype.Proxy:
		return &proxy.Adaptor{}
	case apitype.Replicate:
		return &replicate.Adaptor{}
	}
	return nil
}
