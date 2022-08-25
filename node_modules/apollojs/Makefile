%.js: %.pjs
	cpp -P -C -w -undef $(OPTIONS) $< > $@

.PHONY: all clean client server

all: client server
client: OPTIONS += -Ibower_components
client: client.js
server: server.js

clean:
	$(RM) -f *.js
