const { addonBuilder } = require("stremio-addon-sdk");

const himovies = require("./himovies");
// Docs: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/manifest.md
const manifest = require("./manifest");
const builder = new addonBuilder(manifest)



builder.defineStreamHandler((args) => {
	console.log("addon.js streams:", args);
	if (args.id.startsWith("Hmovies_id:")) {
		return Promise.resolve(himovies.stream(args.type, args.id))
		.then((streams) => ({ streams: streams }));
		//.then((streams) => { console.log('streams', streams)});
	} else {
		console.log('stream reject');
		return Promise.resolve({ streams: [] });
	}
});

builder.defineCatalogHandler((args) => {
	console.log('test');
	console.log("addon.js Catalog:", args);
	if(args.id.startsWith('Hmovies')){
		if (args.extra.search) { 
			return Promise.resolve(himovies.search(args.type, encodeURIComponent(args.extra.search),args.extra.skip))
				//.then((metas) => { console.log('metas', metas) });
				.then((metas) => ({ metas: metas }));
		} else if(id.split('-').legth >1) {
			return Promise.resolve(himovies.catalog(args.type, args.id,args.extra.skip))
				//.then((metas) => { console.log('metas', metas) });
				.then((metas) => ({ metas: metas }));
		}
	}else return Promise.resolve({ metas: [] });
});

builder.defineMetaHandler((args) => {
	console.log("addon.js meta:", args);

	if (args.id.startsWith("Hmovies_id:")) {
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