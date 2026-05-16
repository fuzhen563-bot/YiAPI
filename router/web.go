package router

import (
	"embed"
	"fmt"
	"github.com/gin-contrib/gzip"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
	"yiapi/common"
	"yiapi/common/config"
	"yiapi/controller"
	"yiapi/middleware"
	"net/http"
	"strings"
)

func SetWebRouter(router *gin.Engine, buildFS embed.FS) {
	var indexPageData []byte
	theme := config.Theme
	data, err := buildFS.ReadFile(fmt.Sprintf("web/build/%s/index.html", theme))
	if err != nil || len(data) == 0 {
		theme = "default"
		data, err = buildFS.ReadFile("web/build/default/index.html")
		if err != nil {
			indexPageData = []byte{}
		} else {
			indexPageData = data
		}
	} else {
		indexPageData = data
	}
	router.Use(gzip.Gzip(gzip.DefaultCompression))
	router.Use(middleware.GlobalWebRateLimit())
	router.Use(middleware.Cache())
	router.Use(static.Serve("/", common.EmbedFolder(buildFS, fmt.Sprintf("web/build/%s", theme))))
	router.NoRoute(func(c *gin.Context) {
		if strings.HasPrefix(c.Request.RequestURI, "/v1") || strings.HasPrefix(c.Request.RequestURI, "/api/") {
			controller.RelayNotFound(c)
			return
		}
		c.Header("Cache-Control", "no-cache")
		c.Data(http.StatusOK, "text/html; charset=utf-8", indexPageData)
	})
}
