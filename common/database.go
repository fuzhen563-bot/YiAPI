package common

import (
	"yiapi/common/env"
)

var UsingSQLite = false
var UsingPostgreSQL = false
var UsingMySQL = false

var SQLitePath = "yiapi.db"
var SQLiteBusyTimeout = env.Int("SQLITE_BUSY_TIMEOUT", 3000)
