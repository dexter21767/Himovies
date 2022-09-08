const { addonBuilder } = require("stremio-addon-sdk");

const himovies = require("./himovies");
const stream = require("./himovies_tt");
// Docs: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/manifest.md
const manifest = require("./manifest");
const builder = new addonBuilder(manifest)



builder.defineStreamHandler((args) => {
	console.log("addon.js streams:", args);
	if (args.id.match(/Hmovies_id:[^xyz]*/i)) {
		return Promise.resolve(himovies.stream(args.type, args.id))
			.then((streams) => ({ streams: streams }));
		//.then((streams) => { console.log('streams', args+streams)});
	} else if (args.id.match(/tt[0-9]*/i)) {
		return Promise.resolve(stream(args.type, args.id))
			.then((streams) => ({ streams: streams }));
		//.then((streams) => { console.log('streams', args+streams)});
	} else {
		console.log('stream reject');
		return Promise.resolve({ streams: [] });
	}
});

builder.defineCatalogHandler((args) => {
	console.log("addon.js Catalog:", args);
	if (args.extra.search) {
		return Promise.resolve(himovies.search(args.type, args.extra.search))
			//.then((metas) => { console.log('metas', metas) });
			.then((metas) => ({ metas: metas }));
	} else {
		return Promise.resolve(himovies.catalog(args.type, args.id))
			//.then((metas) => { console.log('metas', metas) });
			.then((metas) => ({ metas: metas }));
	}
});

builder.defineMetaHandler((args) => {
	console.log("addon.js meta:", args);

	if (args.id.match(/Hmovies_id:[^xyz]*/i)) {
		//console.log('meta mycima');
		return Promise.resolve(himovies.meta(args.type, args.id))
			//.then((metas) => { console.log('metas', metas)});
			.then((meta) => ({ meta: meta }));
	} else {
		console.log('meta reject');
		return Promise.resolve({ meta: [] });
	}


});

module.exports = builder.getInterface()