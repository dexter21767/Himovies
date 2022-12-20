const axios = require('axios').default;
const cheerio = require('cheerio');
const { parse } = require("fast-html-parser");
const { MOVIES } = require('@consumet/extensions')

const flixhq = new MOVIES.FlixHQ();

const host = flixhq.baseUrl;
const logo = flixhq.logo;


client = axios.create({
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0"
    },
    timeout: 5000
});

async function request(url, header) {

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

async function stream(type, Hmovies_id) {
    try{
    const streams = [];
    let id = decodeURIComponent(Hmovies_id.split(":")[1]);
    if(id.startsWith('/')) id = id.slice(1,id.length );
    const mediaId = id.split('-').pop();
    const episodeId = Hmovies_id.split(":")[2];
    console.log("id",id,"mediaId",mediaId,"episodeId",episodeId)
    servers = await flixhq.fetchEpisodeServers(episodeId,id);
    if(!servers) throw "error loading episode servers"
    console.log(servers);
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
    return streams;
    }catch(e){
        console.error(e);
        return Promise.reject(e);
    }
}

async function meta(type, Hmovies_id) {
    try {
        var id = Hmovies_id.split(":")[1];
        console.log(id);
        data = await flixhq.fetchMediaInfo(decodeURIComponent(id))
        console.log(data)
        data.type = type;
        if (data.hasOwnProperty("image")) data.image = data.image.replace("250x400",'1200x600'); data.poster = data.image; data.background = data.image; delete data.image;
        if (data.hasOwnProperty("production")) delete data.production;
        if (data.hasOwnProperty("tags")) delete data.tags;
        if (data.hasOwnProperty("duration")) data.runtime = data.duration; delete data.duration;
        if (data.hasOwnProperty("title")) data.name  = data.title; delete data.title;
        if (data.hasOwnProperty("url")) data.website = data.url; delete data.url;
        if (data.hasOwnProperty("rating")) {
            if (data.rating) data.imdbRating = data.rating;
            delete data.rating;
        }
        if (type == "series") data.videos = await seasonlist(data.id, new Date(data.releaseDate).toISOString());
        else data.id = data.id + ":" + data.episodes[0].id;
        delete data.episodes;
        if (data.hasOwnProperty("releaseDate")) {
            if (type == "movie") data.released = new Date(data.releaseDate).toISOString()
            data.releaseInfo = data.releaseDate.split('-')[0];
            delete data.releaseDate;
        }
        data.id = "Hmovies_id:" + data.id;
        //console.log("meta",data)
        return data;
    } catch (e) {
        console.error(e)
        return Promise.reject(e);
    }
}

async function search(type, query, skip) {
    try {
        let url = `${host}/search/${encodeURIComponent(query.replace(/\s/g, '-'))}`
        if (skip) {
            skip = Math.round((skip / 32) + 1);
            url += `?page=${skip}`
        }
        console.log('url', url);
        data = await request(url);
        if (!data || !data.data) throw "error getting data"
        let response = data.data;
        let $ = cheerio.load(response);
        //console.log($('.film-detail'))
        return ($('.flw-item').map((i, el) => {
            // let year_or_episode = $(el).find('.fd-infor > .fdi-item').last().text()
            // If movies then year is fine, if TV then shows # of seasons


            if ((type == "movie") && ($(el).find('.film-name a').attr('href').startsWith('/movie/'))) {
                return {
                    id: "Hmovies_id:" + encodeURIComponent($(el).find('.film-name a').attr('href').replace(host + '/', '')),
                    type: "movie",
                    name: $(el).find('.film-name a').attr('title'),
                    releaseInfo: $(el).find('.fd-infor > .fdi-item').first().text() || "N/A",
                    duration: $(el).find('.fd-infor > .fdi-item').last().text() || "N/A",
                    poster: $(el).find('.film-poster img').attr('data-src').replace("250x400",'1200x600'),
                    posterShape: 'poster',
                }
            } else if (type == "series" && ($(el).find('.film-name a').attr('href').startsWith('/tv/'))) {
                return {
                    id: "Hmovies_id:" + encodeURIComponent($(el).find('.film-name a').attr('href').replace(host + '/', '')),
                    type: "series",
                    name: $(el).find('.film-name a').attr('title'),
                    poster: $(el).find('.film-poster img').attr('data-src').replace("250x400",'1200x600'),
                    posterShape: 'poster',
                }
            }
        })).get()
    } catch (e) {
        console.error(e)
        return Promise.reject(e);
    }
}

async function seasonlist(Hmovies_id = String, releaseDate = String) {
    try {
        const id = Hmovies_id.split("-").pop();
        console.log("id", id,"Hmovies_id",Hmovies_id)
        const url = `${host}/ajax/v2/tv/seasons/${id}/`;
        console.log(url)
        const data = await request(url);
        if (!data || !data.data) throw "error getting data"
        var html = parse(data.data);
        var list = html.querySelectorAll("a.dropdown-item");

        var seasonssarray = [];
        for (let i = 0; i < list.length; i++) {
            let seasonId = list[i].rawAttributes['data-id'];
            let epurl = `${host}/ajax/v2/season/episodes/${seasonId}`;
            console.log('epurl', epurl)
            let data = await request(epurl);
            if (!data || !data.data) throw "error getting data"
            const html = parse(data.data);
            var eplist = html.querySelectorAll("ul.nav li.nav-item a");
            //console.log(epurl);
            for (let c = 0; c < eplist.length; c++) {
                seasonssarray.push({
                    id: "Hmovies_id:" + encodeURIComponent(Hmovies_id) + ':' + eplist[c].rawAttributes['data-id'],
                    title: eplist[c].rawText,
                    season: i + 1,
                    episode: c + 1,
                    released: releaseDate,
                    available: true
                });
            }
        }
        console.log('seasonssarray',seasonssarray)
        return seasonssarray;
    } catch (e) {
        console.error(e);
        return Promise.reject(e);
    }
}

async function catalog(type, id, skip) {
    try {
        if (skip) {
            skip = Math.round((skip / 32) + 1);
        }

        if (id == 'Hmovies-Popular') {
            var url = `${host}/movie/`;
            if (skip) {
                url += `?page=${skip}`
            }
        } else if (id == "Hseries-Popular") {
            var url = `${host}/tv-show/`;
            if (skip) {
                url += `?page=${skip}`
            }
        } else if (id == "Hmovies-Top") {
            var url = `${host}/top-imdb/?type=movie`;
            if (skip) {
                url += `&page=${skip}`
            }
        } else if (id == "Hseries-Top") {
            var url = `${host}/top-imdb/?type=tv`;
            if (skip) {
                url += `&page=${skip}`
            }
        }
        console.log('url', url);

        data = await request(url);
        if (!data || !data.data) throw "error getting data"
        let response = data.data;
        let $ = cheerio.load(response);
        return ($('.flw-item').map((i, el) => {
            // let year_or_episode = $(el).find('.fd-infor > .fdi-item').last().text()
            // If movies then year is fine, if TV then shows # of seasons


            if ((type == "movie") && ($(el).find('.film-name a').attr('href').startsWith('/movie/'))) {
                return {
                    id: "Hmovies_id:" + encodeURIComponent($(el).find('.film-name a').attr('href')),
                    type: "movie",
                    name: $(el).find('.film-name a').attr('title'),
                    releaseInfo: $(el).find('.fd-infor > .fdi-item').first().text() || "N/A",
                    duration: $(el).find('.fd-infor > .fdi-item').last().text() || "N/A",
                    poster: $(el).find('.film-poster img').attr('data-src').replace("250x400",'1200x600'),
                    posterShape: 'poster'
                }
            } else if (type == "series" && ($(el).find('.film-name a').attr('href').startsWith('/tv/'))) {
                return {
                    id: "Hmovies_id:" + encodeURIComponent($(el).find('.film-name a').attr('href')),
                    type: "series",
                    name: $(el).find('.film-name a').attr('title'),
                    poster: $(el).find('.film-poster img').attr('data-src').replace("250x400",'1200x600'),
                    posterShape: 'poster'
                }
            }
        })).get()
    } catch (e) {
        console.error(e)
        return Promise.reject(e);
    }
}

module.exports = {
    catalog,
    search,
    meta,
    stream
};
