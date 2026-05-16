package aiproxy

import "yiapi/relay/adaptor/openai"

var ModelList = []string{""}

func init() {
	ModelList = openai.ModelList
}
