APP := allpeople

COMMA := ,
EMPTY :=
SPACE := $(EMPTY) $(EMPTY)

# configure platform
PLATFORM := $(shell uname -s)
ifneq ($(filter MINGW%,$(PLATFORM)),)
PLATFORM := Windows
SLIB_EXT := dll
else
PLATFORM := Linux
SLIB_EXT := so
endif

# find MySQL plugin directory
ifeq ($(PLATFORM),Windows)
MYSQL_PLUGIN_DIR := $(subst ?,$(SPACE),$(dir $(subst $(SPACE),?,$(shell which mysql)))../lib/plugin)
else
MYSQL_PLUGIN_DIR := /usr/lib/mysql/plugin
endif

call_ipc.$(SLIB_EXT): call_ipc.c
	gcc -I. -shared -o $@ $^

clean:
	rm -f call_ipc.$(SLIB_EXT)

install: call_ipc.$(SLIB_EXT)
	install $< "$(MYSQL_PLUGIN_DIR)/$(APP)_$<"
	mysql $(APP) -e "DROP FUNCTION call_ipc; CREATE FUNCTION call_ipc RETURNS INTEGER SONAME '$(APP)_call_ipc.dll'"

uninstall:
	rm -f $(MYSQL_PLUGIN_DIR)/$(APP)_call_ipc.$(SLIB_EXT)
	mysql $(APP) -e "DROP FUNCTION call_ipc"
