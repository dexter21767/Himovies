const axios = require('axios').default;
const cheerio = require('cheerio');
var slugify = require('slugify');
const {parse} = require("fast-html-parser");
const m3u = require('m3u8-reader')
const host = "https://sflix.to";

client = axios.create({
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0"
            }
        });

async function stream(type,Hmovies_id) {
	 var slug = Hmovies_id.split(":")[1].toLowerCase();
    var id = Hmovies_id.split(":")[2];
	var episodeId = Hmovies_id.split(":")[3];
	if (type == "movie"){
    var url = `${host}/ajax/movie/episodes/${id}/`;
	}
	else if (type == "series"){
	var url = `${host}/ajax/v2/episode/servers/${episodeId}`;
    }
    let response = (await client.get(url)).data;
	  let $ = cheerio.load(response);
      let servers = ($('a').map((i, el) => {
            return {
                server: $(el).find('span').text() || null,
                serverId: $(el).attr('data-id') || null,
                slug: $(el).attr('id') || null,
            }
        })).get()
	//console.log(servers);
	if (type == "movie"){
    var href = `/movie/free-${slug}-hd-${id}`;
	}
	else if (type == "series"){
    var href = `/tv/free-${slug}-hd-${id}`;
	}
	let streams = [];
	let streams_count = 0;
	for (let source_counter = 0; source_counter < servers.length; source_counter++) { 
		let Sources = await getSources(servers[source_counter].serverId, href);
		if (Sources){
			if(Sources.tracks){
				var subtitles = await getsubtitles(Sources.tracks);
			};
			let m3u8_source = (await client.get(Sources.sources[0].file)).data;
			var source_stream_array = m3u(m3u8_source);
			for (var array_counter = 0; array_counter < source_stream_array.length; array_counter=array_counter+2) { 
			//console.log('array',array);
			streams[streams_count]={
				name: servers[source_counter].server,
				description: source_stream_array[array_counter]['STREAM-INF'].RESOLUTION,
				url: source_stream_array[array_counter+1]
			};
			//console.log(Sources);
			
			if(Sources.tracks){
				streams[source_counter].subtitles=subtitles;
			};
			streams_count++
			}
		}
	}
	//console.log(streams);
		return streams;
}

async function getsubtitles(subs) {
	let subtitles = [];
	for (let i = 0; i < subs.length; i++) { 
	subtitles[i]={
				id: subs[i].label,
				url: subs[i].file,
				lang: subs[i].label
			};
	};
return subtitles;
}

    async function getRecaptchaKey(watchURL) {
		//console.log (watchURL);
        let response = (await client.get(watchURL)).data
        RecaptchaKey = new RegExp(/recaptcha_site_key = '(.*?)'/gm).exec(response)[1]
		return RecaptchaKey;
    }

    async function getVToken(RecaptchaKey) {
        let info = (await client.get(`https://www.google.com/recaptcha/api.js?render=${RecaptchaKey}`, {
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        })).data
        vToken = (new RegExp(/releases\/(.*?)\//gm).exec(info)[1])
		return vToken;
    }
    
    async function getRecaptchaToken(RecaptchaKey,vToken) {
        const reloadLink = `https://www.google.com/recaptcha/api2/reload?k=${RecaptchaKey}`
        let domain = btoa(`${host}:443`).replace(/\n/g, '').replace(/=/g, '.')
        let properLink = `https://www.google.com/recaptcha/api2/anchor?ar=1&k=${RecaptchaKey}&co=${domain}&hl=en&v=${vToken}&size=invisible&cb=cs3`
        let tokenRequest = (await client.get(properLink)).data
        let longToken = cheerio.load(tokenRequest)('#recaptcha-token').attr('value')
        let finalRequest = await client.post(reloadLink, `v=${vToken}&k=${RecaptchaKey}&c=${longToken}&co=${domain}&sa=&reason=q`, {
            headers: { 
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Expires': '0',
            }
        })
        RecaptchaToken = new RegExp(/rresp\","(.+?)\"/gm).exec(finalRequest.data)[1]
		return RecaptchaToken;
    }

    async function iframeInfo(serverId,RecaptchaToken,watchURL) {
        let info = await client.get(`${host}/ajax/get_link/${serverId}?_token=${RecaptchaToken}`, { 
            headers: { 
                "Referer": watchURL
            } 
        })
        let URL = info.data.link // e.x https://mzzcloud.life/embed-4/25kKV67FpxEH?z=
        let resp =  (await client.get(URL, { 
            headers: { 
                "Referer": host
            } 
        })).data
        // console.log(resp)
        // Setup needed variables for getting sources
		
        RecaptchaNumber = new RegExp(/recaptchaNumber = '(.*?)'/gm)
		
		if(RecaptchaNumber){
			RecaptchaNumber=RecaptchaNumber.exec(resp);
			if(RecaptchaNumber){
			RecaptchaNumber=RecaptchaNumber[1];
		}
		}
        iframeURL = URL.substring(0, URL.lastIndexOf('/'))
		if(URL.lastIndexOf('?')>0){
        iframeId = URL.substring(URL.lastIndexOf('/') + 1, URL.lastIndexOf('?'))
		}else{
		iframeId = URL.substring(URL.lastIndexOf('/') + 1)	
		}
		return {iframeURL,iframeId};
    }
	
    async function getSources(serverId, href) {
        try {
            // First we get recaptchaSiteKey
            serverId = serverId;
            watchURL = "https://sflix.to" + href.replace('/', "/watch-") + `.${serverId}`
			
            RecaptchaKey = await getRecaptchaKey(watchURL)
			//return
            // console.log("recaptchaKey: " + RecaptchaKey)
            // END
            // Now we get vToken by calling a method
            vToken = await getVToken(RecaptchaKey);
            // console.log("vToken after: " + vToken)
            // END
            // Then we grab the token
            RecaptchaToken = await getRecaptchaToken(RecaptchaKey,vToken)
            // console.log("captchaToken: " + RecaptchaToken)
            // END
            // After that, we scrape the iframe url for information like recaptchaNumber
            let {iframeURL,iframeId} = await iframeInfo(serverId,RecaptchaToken,watchURL);
            // console.log(RecaptchaNumber)
            // console.log(iframeURL)
            // console.log(iframeId)
            // END
            const properURL = (iframeURL.replace('/embed', '/ajax/embed')) + `/getSources?id=${iframeId}&_token=${RecaptchaToken}&_number=${RecaptchaNumber}`
            return (await client.get(properURL, {
                headers: {
                    "Referer": "https://sflix.to/",
                    "X-Requested-With": "XMLHttpRequest",
                    "Accept": "*/*",
                    "Accept-Language": "en-US,en;q=0.5",
                    "Connection": "keep-alive",
                    "TE": "trailers"
                }
            })).data   
        } catch (e) {
			return;
            console.error(e)
        }
    }

async function meta(type, Hmovies_id) {
	
    var slug = Hmovies_id.split(":")[1].toLowerCase();
    var id = Hmovies_id.split(":")[2];
	if (type == "movie"){
    var url = `${host}/movie/free-${slug}-hd-${id}/`;
	}
	else if (type == "series"){
    var url = `${host}/tv/free-${slug}-hd-${id}/`;
	}
    //console.log("url", url);
	let response = (await client.get(url)).data;
        var html = parse(response);
        var details = html.querySelector("div.elements div.row div.col-xl-5").querySelectorAll('div');
        var img = html.querySelector("div.dp-i-c-poster img").rawAttributes['src'];
		var bg = html.querySelector("div.cover_follow").rawAttributes['style'];
		if(bg){
			bg = bg.substring(22, bg.length - 2);
		}
		var imdbRating = html.querySelector("span.imdb");
		if (imdbRating){
			imdbRating = imdbRating.rawText.split(':')[1];
		}
		var released = details[0].childNodes[2].rawText;
		var year = released.slice('-')[0];
		var genresarray = details[1].querySelectorAll('a');
        var title = html.querySelector("h2.heading-name a").rawText;
        var description = html.querySelector("div.description");
		if (description){
			if(description.childNodes.length){
			description =  description.childNodes[2].rawText;
			}else{
			description= description.rawText;
			}
		}
		var actorsarray = details[2].querySelectorAll('a');
		var details2 = html.querySelector("div.elements div.row div.col-xl-6").querySelectorAll('div');
		if(details2){
		var country = details2[1].querySelector('a');
		if (country){	
		 country = country.rawAttributes['title'];
		}
        var runtime = html.querySelector("span.duration");
		if (runtime){
			runtime = runtime.rawText;
		}else {
			runtime = details2[0].childNodes[1].rawText;
		}
		}
		 if (type == "series"){
		var seasons = await seasonlist(Hmovies_id);
		}


        var actors = [];
        if (actorsarray) {
            for (let i = 0; i < actorsarray.length; i++) {
                actors[i] = actorsarray[i].rawAttributes['title'];
            }
        }

        genres = [];
        if (genresarray) {
            for (let i = 0; i < genresarray.length; i++) {
                genres[i] = genresarray[i].rawAttributes['title'];
            }
        }

        var metaObj = {
            id: Hmovies_id,
            name: title,
            posterShape: 'poster',
            type: type,
        };
        if (year) {
            metaObj.releaseInfo = year
        };
        if (img) {
            metaObj.poster = img
        };
        if (bg) {
            metaObj.background = bg
        };
        if (released) {
            metaObj.released = released 
        };
        if (genres) {
            metaObj.genres = genres
        };
        if (description) {
            metaObj.description = description
        };
        if (actors) {
            metaObj.cast = actors
        };
        if (runtime){metaObj.runtime = runtime};
		if (country){metaObj.country = country};
		if (type == "series"){metaObj.videos = seasons};
		if (imdbRating){metaObj.imdbRating = imdbRating};	 
        //console.log("metaObj", metaObj);
        return metaObj;

}


async function search(type, query) {
         try {
            let url = `${host}/search/${query.replace(/\s/g,'-')}`
			console.log('url',url);
            let response = (await client.get(url)).data;
            let $ = cheerio.load(response);
			//console.log($('.film-detail'))
            return ($('.flw-item').map((i, el) => {
                // let year_or_episode = $(el).find('.fd-infor > .fdi-item').last().text()
                // If movies then year is fine, if TV then shows # of seasons
				
				
                 if ((type == "movie") && ($(el).find('.film-name a').attr('href').startsWith('/movie/'))) {
					//console.log($(el).find('.film-poster img'))
					 let id = slugify($(el).find('.film-name a').attr('title').replace(/\s/g,'-'), {
						  replacement: '-',  // replace spaces with replacement character, defaults to `-`
						  remove: undefined, // remove characters that match regex, defaults to `undefined`
						  lower: true,      // convert to lower case, defaults to `false`
						  strict: true,     // strip special characters except replacement, defaults to `false`
						  locale: 'vi',       // language code of the locale to use
						  trim: true         // trim leading and trailing replacement chars, defaults to `true`
						})
                    return {
                        name: $(el).find('.film-name a').attr('title'),
                        type: "movie",
                        //href: $(el).find('.film-name a').attr('href'), 
                        id: "Hmovies_id:" + id +':'+ $(el).find('.film-name a').attr('href').split('-').pop(),
                        releaseInfo: $(el).find('.fd-infor > .fdi-item').last().text() || "N/A",
						//releaseInfo: $(el).find('.fd-infor > .fdi-item').first().text() || "N/A",
						//duration: $(el).find('.fd-infor > .fdi-item').last().text() || "N/A",
						poster: $(el).find('.film-poster img').attr('data-src'),
						posterShape: 'poster'
                        //quality: $(el).find('.fd-infor > .fdi-item strong').text() || "N/A",
                        //rating: $(el).find('.fd-infor > .fdi-item').first().text(),
                    }
                } else if (type == "series" && ($(el).find('.film-name a').attr('href').startsWith('/tv/'))) {
                    let id = slugify($(el).find('.film-name a').attr('title').replace(/\s/g,'-'), {
						  replacement: '-',  // replace spaces with replacement character, defaults to `-`
						  remove: undefined, // remove characters that match regex, defaults to `undefined`
						  lower: true,      // convert to lower case, defaults to `false`
						  strict: true,     // strip special characters except replacement, defaults to `false`
						  locale: 'vi',       // language code of the locale to use
						  trim: true         // trim leading and trailing replacement chars, defaults to `true`
						})
					return {
                        name: $(el).find('.film-name a').attr('title'),
                        type: "series",
                        //href: $(el).find('.film-name a').attr('href'),
                        id: "Hmovies_id:" + id +':'+ $(el).find('.film-name a').attr('href').split('-').pop(),
                        seasons: $(el).find('.fd-infor > .fdi-item').last().text() || "N/A",
						poster: $(el).find('.film-poster img').attr('data-src'),
						posterShape: 'poster'
                        //quality: $(el).find('.fd-infor > .fdi-item strong').text() || "N/A",
                        //rating: $(el).find('.fd-infor > .fdi-item').first().text(),
                    }
                }
            })).get()
        } catch(e) {
            console.error(e)
        }
}


async function seasonlist(Hmovies_id) {
	 var slug = Hmovies_id.split(":")[1].toLowerCase();
    var id = Hmovies_id.split(":")[2];
	var url = `${host}/ajax/v2/tv/seasons/${id}/`;
	let response = (await client.get(url)).data;
		//console.log(res.data);
		var html = parse(response);
        var list = html.querySelectorAll("a.dropdown-item");
		
         var seasonssarray = [];
		for (let i = 0; i < list.length; i++) {
			let seasonId = list[i].rawAttributes['data-id'];
			let epurl = `${host}/ajax/v2/season/episodes/${seasonId}`;
			console.log('epurl',epurl)
			eps = (await client.get(epurl)).data;
			html = parse(eps);
			var eplist = html.querySelectorAll("div.swiper-slide");
			
			//console.log(epurl);
			for (let c = 0; c < eplist.length; c++) { 
			//ep = ;
			seasonssarray.push({
				id: Hmovies_id+':'+eplist[c].querySelector('div.flw-item').rawAttributes['data-id'],
				title: eplist[c].querySelector('div.film-detail').rawText,
				season: i+1,
				episode: c+1,
				released: '2010-12-06T05:00:00.000Z'
			});
			}
		}
		//console.log('seasonssarray',seasonssarray)
		return seasonssarray;

}

async function catalog(type, id) {
         try {
			 if(id == 'Hmovies-Popular'){
			var url = `${host}/movie/`;
			 }else if(id == "Hseries-Popular"){
            var url = `${host}/tv-show/`;
			 }else if(id == "Hseries-Top"|| id == "Hmovies-Top"){
            var url = `${host}/top-imdb/`; 
			 } 
			console.log('url',url);
            let response = (await client.get(url)).data;
            let $ = cheerio.load(response);
			//console.log($('.film-detail'))
            return ($('.flw-item').map((i, el) => {
                // let year_or_episode = $(el).find('.fd-infor > .fdi-item').last().text()
                // If movies then year is fine, if TV then shows # of seasons
				
				
                if ((type == "movie") && ($(el).find('.film-name a').attr('href').startsWith('/movie/'))) {
					//console.log($(el).find('.film-poster img'))
					 let id = slugify($(el).find('.film-name a').attr('title').replace(/\s/g,'-'), {
						  replacement: '-',  // replace spaces with replacement character, defaults to `-`
						  remove: undefined, // remove characters that match regex, defaults to `undefined`
						  lower: true,      // convert to lower case, defaults to `false`
						  strict: true,     // strip special characters except replacement, defaults to `false`
						  locale: 'vi',       // language code of the locale to use
						  trim: true         // trim leading and trailing replacement chars, defaults to `true`
						})
                    return {
                        name: $(el).find('.film-name a').attr('title'),
                        type: "movie",
                        //href: $(el).find('.film-name a').attr('href'), 
                        id: "Hmovies_id:" + id +':'+ $(el).find('.film-name a').attr('href').split('-').pop(),
                        releaseInfo: $(el).find('.fd-infor > .fdi-item').last().text() || "N/A",
						//releaseInfo: $(el).find('.fd-infor > .fdi-item').first().text() || "N/A",
						//duration: $(el).find('.fd-infor > .fdi-item').last().text() || "N/A",
						poster: $(el).find('.film-poster img').attr('data-src'),
						posterShape: 'poster'
                        //quality: $(el).find('.fd-infor > .fdi-item strong').text() || "N/A",
                        //rating: $(el).find('.fd-infor > .fdi-item').first().text(),
                    }
                } else if (type == "series" && ($(el).find('.film-name a').attr('href').startsWith('/tv/'))) {
                    let id = slugify($(el).find('.film-name a').attr('title').replace(/\s/g,'-'), {
						  replacement: '-',  // replace spaces with replacement character, defaults to `-`
						  remove: undefined, // remove characters that match regex, defaults to `undefined`
						  lower: true,      // convert to lower case, defaults to `false`
						  strict: true,     // strip special characters except replacement, defaults to `false`
						  locale: 'vi',       // language code of the locale to use
						  trim: true         // trim leading and trailing replacement chars, defaults to `true`
						})
					return {
                        name: $(el).find('.film-name a').attr('title'),
                        type: "series",
                        //href: $(el).find('.film-name a').attr('href'),
                        id: "Hmovies_id:" + id +':'+ $(el).find('.film-name a').attr('href').split('-').pop(),
                        seasons: $(el).find('.fd-infor > .fdi-item').last().text() || "N/A",
						poster: $(el).find('.film-poster img').attr('data-src'),
						posterShape: 'poster'
                        //quality: $(el).find('.fd-infor > .fdi-item strong').text() || "N/A",
                        //rating: $(el).find('.fd-infor > .fdi-item').first().text(),
                    }
                }
            })).get()
        } catch(e) {
            console.error(e)
        }
}
module.exports = {
	catalog,
    search,
    meta,
    stream
};
