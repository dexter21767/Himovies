const axios = require('axios').default;
const cheerio = require('cheerio');
var slugify = require('slugify');
const {
    parse
} = require("fast-html-parser");
const m3u = require('m3u8-reader')
    const cinemeta = require('./cinemeta');

const host = "https://sflix.to";

client = axios.create({
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0"
    }
});

async function getstream(type, Hmovies_id) {
    var slug = Hmovies_id.split(":")[1].toLowerCase();
    var id = Hmovies_id.split(":")[2];
    var episodeId = Hmovies_id.split(":")[3];
    if (type == "movie") {
        var url = `${host}/ajax/movie/episodes/${id}/`;
    } else if (type == "series") {
        var url = `${host}/ajax/v2/episode/servers/${episodeId}`;
    }
	console.log(url)
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
    if (type == "movie") {
        var href = `/movie/free-${slug}-hd-${id}`;
    } else if (type == "series") {
        var href = `/tv/free-${slug}-hd-${id}`;
    }
    let streams = [];
    let streams_count = 0;
    for (let source_counter = 0; source_counter < servers.length; source_counter++) {
        let Sources = await getSources(servers[source_counter].serverId, href);
        if (Sources) {
            if (Sources.tracks) {
                var subtitles = await getsubtitles(Sources.tracks);
            };
            let m3u8_source = (await client.get(Sources.sources[0].file)).data;
            var source_stream_array = m3u(m3u8_source);
            for (var array_counter = 0; array_counter < source_stream_array.length; array_counter = array_counter + 2) {
                //console.log('array',array);
                streams[streams_count] = {
                    name: "Himovies " + servers[source_counter].server,
                    description: source_stream_array[array_counter]['STREAM-INF'].RESOLUTION,
                    url: source_stream_array[array_counter + 1]
                };
                //console.log(Sources);

                if (Sources.tracks) {
                    streams[source_counter].subtitles = subtitles;
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
        subtitles[i] = {
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

async function getRecaptchaToken(RecaptchaKey, vToken) {
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

async function iframeInfo(serverId, RecaptchaToken, watchURL) {
    let info = await client.get(`${host}/ajax/get_link/${serverId}?_token=${RecaptchaToken}`, {
        headers: {
            "Referer": watchURL
        }
    })
        let URL = info.data.link // e.x https://mzzcloud.life/embed-4/25kKV67FpxEH?z=
        let resp = (await client.get(URL, {
                headers: {
                    "Referer": host
                }
            })).data
        // console.log(resp)
        // Setup needed variables for getting sources

        RecaptchaNumber = new RegExp(/recaptchaNumber = '(.*?)'/gm)

        if (RecaptchaNumber) {
            RecaptchaNumber = RecaptchaNumber.exec(resp);
            if (RecaptchaNumber) {
                RecaptchaNumber = RecaptchaNumber[1];
            }
        }
        iframeURL = URL.substring(0, URL.lastIndexOf('/'))
        if (URL.lastIndexOf('?') > 0) {
            iframeId = URL.substring(URL.lastIndexOf('/') + 1, URL.lastIndexOf('?'))
        } else {
            iframeId = URL.substring(URL.lastIndexOf('/') + 1)
        }
        return {
        iframeURL,
        iframeId
    };
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
        RecaptchaToken = await getRecaptchaToken(RecaptchaKey, vToken)
            // console.log("captchaToken: " + RecaptchaToken)
            // END
            // After that, we scrape the iframe url for information like recaptchaNumber
            let {
            iframeURL,
            iframeId
        } = await iframeInfo(serverId, RecaptchaToken, watchURL);
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


async function getEp(type, Hmovies_id, season, episode) {
    var slug = Hmovies_id.split(":")[1].toLowerCase();
    var id = Hmovies_id.split(":")[2];
    var url = `${host}/ajax/v2/tv/seasons/${id}/`;
    let response = (await client.get(url)).data;
	
    var html = parse(response);
    var list = html.querySelectorAll("a.dropdown-item");

    let seasonId = list[(season - 1)].rawAttributes['data-id'];
    let epurl = `${host}/ajax/v2/season/episodes/${seasonId}`;
    console.log('epurl', epurl)
    eps = (await client.get(epurl)).data;
    html = parse(eps);
    var eplist = html.querySelectorAll("div.swiper-slide");
    let himoviesid = Hmovies_id + ':' + eplist[(episode - 1)].querySelector('div.flw-item').rawAttributes['data-id'];

    let streams = await getstream(type, himoviesid);
    return streams;

}


async function stream(type, tt) {
	
	console.log (type,tt)
    if (type == "series") {
        let id = tt.split(':');
        tt = id[0];
        var season = id[1];
        var episode = id[2];
    }

    const meta = await cinemeta(type, tt);
    let url = `${host}/search/${meta.name.replace(/\s/g,'-')}`;
    console.log(url);

    let response = (await client.get(url)).data;
    let body = parse(response);
    let list = body.querySelectorAll('.flw-item');

    for (let i = 0; i < list.length; i++) {

        let href = list[i].querySelector('.film-name a').rawAttributes['href'];

        if ((type == "movie") && href.startsWith('/movie/')) {
            let himoviesid = "himoviesid:" + meta.slug + ':' + href.split('-').pop();
            let streams = await getstream(type, himoviesid);
            return streams;
        } else if ((type == "series") && href.startsWith('/tv/')) {
            let himoviesid = "himoviesid:" + meta.slug + ':' + href.split('-').pop();
            let streams = await getEp(type,himoviesid,season,episode);
            return streams;

        }
    }
}


module.exports = stream;
