package baiduv2

import (
	"fmt"

	"yiapi/relay/meta"
	"yiapi/relay/relaymode"
)

func GetRequestURL(meta *meta.Meta) (string, error) {
	switch meta.Mode {
	case relaymode.ChatCompletions:
		return fmt.Sprintf("%s/v2/chat/completions", meta.BaseURL), nil
	default:
	}
	return "", fmt.Errorf("unsupported relay mode %d for baidu v2", meta.Mode)
}
