const axios = require('axios').default;
const cheerio = require('cheerio');
const slugify = require('slugify');
const {decode} = require('html-entities');

const NodeCache = require( "node-cache" );
const MetaCache = new NodeCache( { stdTTL: 21600, checkperiod: 32400 } );
const CatalogCache = new NodeCache( { stdTTL: 21600, checkperiod: 32400 } );
const StreamCache = new NodeCache( { stdTTL: 1800, checkperiod: 2700 } );
const ServersCache = new NodeCache( { stdTTL: 1800, checkperiod: 2700 } );


const { MOVIES } = require('@consumet/extensions')
const flixhq = new MOVIES.FlixHQ();

const host = flixhq.baseUrl;
const logo = flixhq.logo;


client = axios.create({
    baseURL : host,
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0"
    },
    timeout: 5000
});

async function request(url= String, header) {

    return await client
        .get(url, header)
        .then(res => {
            return res;
        })
        .catch(error => {
            if (error.response) {
                console.error('error on himovies.js request:', error.response.status, error.response.statusText, error.config.url);
            } else {
                console.error(error);
            }
        });

}

async function stream(type= String, Hmovies_id= String) {
    try{
    let servers;
    const streams = [];
    let id = decodeURIComponent(Hmovies_id.split(":")[1]);
    if(id.startsWith('/')) id = id.slice(1,id.length );
    const mediaId = id.split('-').pop();
    let episodeId = Hmovies_id.split(":")[2];
    if(!episodeId && mediaId) episodeId = mediaId
    if(!id || !episodeId) throw "ID error";
    console.log("id",id,"mediaId",mediaId,"episodeId",episodeId)
    
    
    const CacheId = `${type}_${id}_${episodeId}`;
    let Cached = StreamCache.get(CacheId);
    if (Cached) return Cached;

    Cached = ServersCache.get(CacheId);
    if(Cached) servers = Cached;
    console.log("servers",servers);
    if(!servers) servers = await flixhq.fetchEpisodeServers(episodeId,id);
    console.log("servers",servers);
    if(!Cached && servers) ServersCache.set(CacheId,servers);

    console.log("servers",servers);
    if(!servers) throw "error loading episode servers"

    const promises = [];
    servers.forEach(server => {
        promises.push(flixhq.fetchEpisodeSources(episodeId,id,server.name).then(data=>{
            data.server=server.name;
            if(data.subtitles){
                let c = 0;
                data.subtitles.forEach(subtitle => {
                    subtitle.id = "sub" + c;
                    c++; 
                    return subtitle;
                })
            }
            return data}))
    });
    let sources = await Promise.allSettled(promises);
    console.log(sources)
    sources.forEach(({ status, value }) => {
     
    if (status != 'fulfilled' || !value || !value.sources) return;
    value.sources.forEach(source=>{
        let Stream = {
            url:source.url,
            //name: value.server,
            description: value.server + " - " + source.quality
        }
        if(value.subtitles) Stream.subtitles = value.subtitles;
        if(value.headers) Stream.behaviorHints={};Stream.behaviorHints.notWebReady = true; Stream.behaviorHints.proxyHeaders = { request: value.headers };

        streams.push(Stream)
    })
    });
    if(streams) StreamCache.set(CacheId,streams);
    return streams;
    }catch(e){
        console.error(e);
        return Promise.reject(e);
    }
}

async function meta(type= String, Hmovies_id= String) {
    try {
        const Cached = MetaCache.get(Hmovies_id);
        if(Cached) return Cached;
        let id = decodeURIComponent(Hmovies_id.split(":")[1]);
        if(id.startsWith('/')) id = id.slice(1,id.length );
        console.log(id);
        data = await flixhq.fetchMediaInfo(id)
        console.log(data)
        data.type = type;
        if (data.hasOwnProperty("image")) data.image = data.image.replace("250x400",'1200x600'); data.poster = data.image; data.background = data.image; delete data.image;
        if (data.hasOwnProperty("production")) delete data.production;
        if (data.hasOwnProperty("tags")) delete data.tags;
        if (data.hasOwnProperty("duration")) data.runtime = data.duration; delete data.duration;
        if (data.hasOwnProperty("title")) data.name  = decode(data.title); delete data.title;
        if (data.hasOwnProperty("url")) data.website = data.url; delete data.url;
        if (data.hasOwnProperty("rating")) {
            if (data.rating) data.imdbRating = data.rating;
            delete data.rating;
        }
        if(data.hasOwnProperty("description")) data.description = decode(data.description);
        if (type == "movie") data.id = data.id + ":" + data.episodes[0].id;
        else if (type == "series"){
             data.videos = [];
             const released = new Date(data.releaseDate).toISOString();
             data.episodes.forEach(episode => {
                data.videos.push({
                    id: "Hmovies_id:" + encodeURIComponent(data.id) + ':' + episode.id,
                    title: episode.title,
                    season :episode.season,
                    episode: episode.number,
                    released: released,
                    available: true
                });
             });
            }
        delete data.episodes;

        if (data.hasOwnProperty("releaseDate")) {
            if (type == "movie") data.released = new Date(data.releaseDate).toISOString()
            data.releaseInfo = data.releaseDate.split('-')[0];
            delete data.releaseDate;
        }
        data.id = "Hmovies_id:" + data.id;
        //console.log("meta",data)
        if(data) MetaCache.set(Hmovies_id,data);
        return data;
    } catch (e) {
        console.error(e)
        return Promise.reject(e);
    }
}

async function search(type = String, query= String, skip) {
    try {
        if (skip) {
            skip = Math.round((skip / 32) + 1);
        }else skip = 1;
        query = slugify(query);
        if(!query) throw new Error("search query couldn't be procecced")
        const CacheId  = `${type}_${query}_${skip}`;
        const Cached = CatalogCache.get(CacheId);
        if(Cached) return Cached;
        
        const url = `/search/${query}?page=${skip}`
        
        console.log('url', url);
        const data = await request(url);
        if (!data || !data.data) throw "error getting data"
        const meta = CatalogMeta(type,data.data);
        if(meta) CatalogCache.set(CacheId,meta);
        return meta;
    } catch (e) {
        console.error(e)
        return Promise.reject(e);
    }
}

async function catalog(type= String, id= String, skip) {
    try {
        let url;
        if (skip) skip = Math.round((skip / 32) + 1);
        else skip = 1;

        const CacheId  = `${type}_${id}_${skip}`;
        const Cached = CatalogCache.get(CacheId);
        if(Cached) return Cached;


        if (id == 'Hmovies-Popular') url = `/movie?page=${skip}`;
        else if (id == "Hseries-Popular") url = `/tv-show?page=${skip}`;
        else if (id == "Hmovies-Top") url = `/top-imdb/?type=movie&page=${skip}`;
        else if (id == "Hseries-Top") url = `/top-imdb/?type=tv&page=${skip}`;
        
        
        console.log('url', url);

        const data = await request(url);
        if (!data || !data.data) throw "error getting data"

        const meta = CatalogMeta(type,data.data);
        if(meta) CatalogCache.set(CacheId,meta);
        return meta;    
    } catch (e) {
        console.error(e)
        return Promise.reject(e);
    }
}

function CatalogMeta(type = String,response){
    const $ = cheerio.load(response);
    return $('.flw-item').map((i, el) => {
        let id = $(el).find('.film-name a').attr('href');
        if (id.startsWith('/')) id = id.replace('/','')
        console.log(id);
        if ((type == "movie") && id.startsWith('movie/')) {
            return {
                id: "Hmovies_id:" + encodeURIComponent(id),
                type: "movie",
                name: $(el).find('.film-name a').attr('title'),
                releaseInfo: $(el).find('.fd-infor > .fdi-item').first().text() || "N/A",
                duration: $(el).find('.fd-infor > .fdi-item').last().text() || "N/A",
                poster: $(el).find('.film-poster img').attr('data-src').replace("250x400",'1200x600'),
                posterShape: 'poster'
            }
        } else if (type == "series" && id.startsWith('tv/')) {
            return {
                id: "Hmovies_id:" + encodeURIComponent(id),
                type: "series",
                name: $(el).find('.film-name a').attr('title'),
                poster: $(el).find('.film-poster img').attr('data-src').replace("250x400",'1200x600'),
                posterShape: 'poster'
            }
        }
    }).get()
}


module.exports = {
    catalog,
    search,
    meta,
    stream
};
