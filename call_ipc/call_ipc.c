#include <mysql.h>
#include <process.h>
#include <stdio.h>
#include <string.h>

#ifdef __WIN32__
#define APP_PATH "c:/dev"
#else
#define APP_PATH "/var/www/"
#endif

my_bool call_ipc_init(UDF_INIT *initid, UDF_ARGS *args, char *message) {
	if (args->arg_count != 1 || args->arg_type[0] != STRING_RESULT) {
		strcpy(message, "call_ipc() requires one string argument");
		return 1;
	}
}

long long call_ipc(UDF_INIT *initid, UDF_ARGS *args, char *is_null, char *error) {
	char buffer[1024];
	// TODO: use _execv to prevent shell-injection attacks
	sprintf(buffer, "node " APP_PATH "/allpeople/server/call-ipc.js %s", args->args[0]);
	system(buffer);
}
