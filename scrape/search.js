const axios = require('axios');
const cheerio = require('cheerio');

function PlayStore(search) {
  return new Promise(async (resolve, reject) => {
    try {
      const { data, status } = await axios.get(`https://play.google.com/store/search?q=${search}&c=apps`)
      const hasil = []
      const $ = cheerio.load(data)
      $('.ULeU3b > .VfPpkd-WsjYwc.VfPpkd-WsjYwc-OWXEXe-INsAgc.KC1dQ.Usd1Ac.AaN0Dd.Y8RQXd > .VfPpkd-aGsRMb > .VfPpkd-EScbFb-JIbuQc.TAQqTe > a').each((i, u) => {
        const linkk = $(u).attr('href')
        const nama = $(u).find('.j2FCNc > .cXFu1 > .ubGTjb > .DdYX5').text()
        const developer = $(u).find('.j2FCNc > .cXFu1 > .ubGTjb > .wMUdtb').text()
        const img = $(u).find('.j2FCNc > img').attr('src')
        const rate = $(u).find('.j2FCNc > .cXFu1 > .ubGTjb > div').attr('aria-label')
        const rate2 = $(u).find('.j2FCNc > .cXFu1 > .ubGTjb > div > span.w2kbF').text()
        const link = `https://play.google.com${linkk}`

        hasil.push({
          link: link,
          nama: nama ? nama : 'No name',
          developer: developer ? developer : 'No Developer',
          img: img ? img : 'https://i.ibb.co/G7CrCwN/404.png',
          rate: rate ? rate : 'No Rate',
          rate2: rate2 ? rate2 : 'No Rate',
          link_dev: `https://play.google.com/store/apps/developer?id=${developer.split(" ").join('+')}`
        })
      })
      if (hasil.every(x => x === undefined)) return resolve({ message: 'Tidak ada result!' })
      resolve(hasil)
    } catch (err) {
      console.error(err)
    }
  })
}

function BukaLapak(search) {
  return new Promise(async (resolve, reject) => {
    try {
      const { data } = await axios.get(`https://www.bukalapak.com/products?from=omnisearch&from_keyword_history=false&search[keywords]=${search}&search_source=omnisearch_keyword&source=navbar`, {
        headers: {
          "user-agent": 'Mozilla/ 5.0(Windows NT 10.0; Win64; x64; rv: 108.0) Gecko / 20100101 Firefox / 108.0'
        }
      })
      const $ = cheerio.load(data);
      const dat = [];
      const b = $('a.slide > img').attr('src');
      $('div.bl-flex-item.mb-8').each((i, u) => {
        const a = $(u).find('observer-tracker > div > div');
        const img = $(a).find('div > a > img').attr('src');
        if (typeof img === 'undefined') return

        const link = $(a).find('.bl-thumbnail--slider > div > a').attr('href');
        const title = $(a).find('.bl-product-card__description-name > p > a').text().trim();
        const harga = $(a).find('div.bl-product-card__description-price > p').text().trim();
        const rating = $(a).find('div.bl-product-card__description-rating > p').text().trim();
        const terjual = $(a).find('div.bl-product-card__description-rating-and-sold > p').text().trim();

        const dari = $(a).find('div.bl-product-card__description-store > span:nth-child(1)').text().trim();
        const seller = $(a).find('div.bl-product-card__description-store > span > a').text().trim();
        const link_sel = $(a).find('div.bl-product-card__description-store > span > a').attr('href');

        const res_ = {
          title: title,
          rating: rating ? rating : 'No rating yet',
          terjual: terjual ? terjual : 'Not yet bought',
          harga: harga,
          image: img,
          link: link,
          store: {
            lokasi: dari,
            nama: seller,
            link: link_sel
          }
        };

        dat.push(res_);
      })
      if (dat.every(x => x === undefined)) return resolve({ message: 'Tidak ada result!' })
      resolve(dat)
    } catch (err) {
      console.error(err)
    }
  })
}

async function happymod(query) {
    try {
        const res = await axios.get("https://unduh.happymod.com/search.html?q=" + query);
        const html = res.data;
        const $ = cheerio.load(html);
        const data = [];
        $('article.flex-item').each((index, element) => {
            const appName = $(element).find('h2.has-normal-font-size.no-margin.no-padding.truncate').text().trim();
            const appVersion = $(element).find('div.has-small-font-size.truncate').first().text().trim();
            const appUrl = $(element).find('a.app.clickable').attr('href');

            if (appName && appVersion && appUrl) {
                data.push({
                    name: appName,
                    version: appVersion,
                    url: "https://unduh.happymod.com/"+appUrl
                });
            }
        });
        return {
        status: true,
        data
        }
    } catch (error) {
        return {
        status: false,
        message: "permintaan tidak dapat diproses!!"
    }
}
}

async function stickersearch(query){
return new Promise((resolve) => {
axios.get(`https://getstickerpack.com/stickers?query=${query}`).then(({ data }) => {
const $ = cheerio.load(data)
const link = [];
$('#stickerPacks > div > div:nth-child(3) > div > a').each(function(a, b) {
link.push($(b).attr('href'))
})
let rand = link[Math.floor(Math.random() * link.length)]
axios.get(rand).then(({data}) => {
const $$ = cheerio.load(data)
const url = [];
$$('#stickerPack > div > div.row > div > img').each(function(a, b) {
url.push($$(b).attr('src').split('&d=')[0])
})
resolve({
title: $$('#intro > div > div > h1').text(),
author: $$('#intro > div > div > h5 > a').text(),
author_link: $$('#intro > div > div > h5 > a').attr('href'),
sticker: url
})
})
})
})
}

async function filmapik21(query) {
  let list = [];
  try {
    let page = await axios.get(`https://www.filmapik21.sbs/?s=${query}`).catch(err => err.response);
    let html = page.data;
    let $ = cheerio.load(html);
    $(".search-page > .result-item", html).each(function() {
      let title = $(this).find("article > .details > .title").text();
      let rating = $(this).find("article > .details > .meta").text();
      let sinopsis = $(this).find("article > .details > .contenido").text();
      let thumb = $(this).find("article > .image > .thumbnail.animation-2 > a > img").attr("src");
      let url = $(this).find("article > .image > .thumbnail.animation-2 > a").attr("href");
      list.push({
        title,
        rating,
        sinopsis,
        thumb,
        url
      });
    });
    return list;
  } catch (error) {
    console.error(error);
    return [];
  }
};

async function webtoons(query) {
	return new Promise((resolve, reject) => {
		axios.get(`https://www.webtoons.com/id/search?keyword=${query}`)
			.then((data) => {
				const $ = cheerio.load(data.data)
				const judul = [];
				const genre = [];
				const author = [];
				const link = [];
				const likes = [];
				const format = [];
				$('#content > div > ul > li > a > div > p.subj').each(function(a, b) {
					deta = $(b).text();
					judul.push(deta)
				})
				$('div > ul > li > a > span').each(function(a, b) {
					deta = $(b).text();
					genre.push(deta)
				})
				$('div > ul > li > a > div > p.author').each(function(a, b) {
					deta = $(b).text();
					author.push(deta)
				})
				$('div > ul > li > a > div > p.grade_area > em').each(function(a, b) {
					deta = $(b).text();
					likes.push(deta)
				})
				$('#content > div > ul > li > a').each(function(a, b) {
					link.push($(b).attr('href'))
				})
				for (let i = 0; i < judul.length; i++) {
					format.push({
						judul: judul[i],
						genre: genre[i],
						author: author[i],
						likes: likes[i],
						link: link[i]
					})
				}
				if (likes == '') {
					resolve({
						status: `${query} tidak dapat ditemukan/error`
					})
				} else {
					resolve(format)
				}
			})
			.catch(reject)
	})
}

async function resep(query) {
	return new Promise(async (resolve, reject) => {
		axios.get('https://resepkoki.id/?s=' + query)
			.then(({
				data
			}) => {
				const $ = cheerio.load(data)
				const link = [];
				const judul = [];
				const upload_date = [];
				const format = [];
				const thumb = [];
				$('body > div.all-wrapper.with-animations > div:nth-child(5) > div > div.archive-posts.masonry-grid-w.per-row-2 > div.masonry-grid > div > article > div > div.archive-item-media > a').each(function(a, b) {
					link.push($(b).attr('href'))
				})
				$('body > div.all-wrapper.with-animations > div:nth-child(5) > div > div.archive-posts.masonry-grid-w.per-row-2 > div.masonry-grid > div > article > div > div.archive-item-content > header > h3 > a').each(function(c, d) {
					jud = $(d).text();
					judul.push(jud)
				})
				for (let i = 0; i < link.length; i++) {
					format.push({
						judul: judul[i],
						link: link[i]
					})
				}
				const result = {
					data: format
				}
				resolve(result)
			})
			.catch(reject)
	})
}

async function gore(query) {
	return new Promise(async (resolve, reject) => {
		axios.get('https://seegore.com/?s=' + query).then(dataa => {
			const $$$ = cheerio.load(dataa)
			pagina = $$$('#main > div.container.main-container > div > div.bb-col.col-content > div > div > div > div > nav > ul > li:nth-child(4) > a').text();
			rand = Math.floor(Math.random() * pagina) + 1
			if (rand === 1) {
				slink = 'https://seegore.com/?s=' + query
			} else {
				slink = `https://seegore.com/page/${rand}/?s=${query}`
			}
			axios.get(slink)
				.then(({
					data
				}) => {
					const $ = cheerio.load(data)
					const link = [];
					const judul = [];
					const uploader = [];
					const format = [];
					const thumb = [];
					$('#post-items > li > article > div.content > header > h2 > a').each(function(a, b) {
						link.push($(b).attr('href'))
					})
					$('#post-items > li > article > div.content > header > h2 > a').each(function(c, d) {
						jud = $(d).text();
						judul.push(jud)
					})
					$('#post-items > li > article > div.content > header > div > div.bb-cat-links > a').each(function(e, f) {
						upl = $(f).text();
						uploader.push(upl)
					})
					$('#post-items > li > article > div.post-thumbnail > a > div > img').each(function(g, h) {
						thumb.push($(h).attr('src'))
					})
					for (let i = 0; i < link.length; i++) {
						format.push({
							judul: judul[i],
							uploader: uploader[i],
							thumb: thumb[i],
							link: link[i]
						})
					}
					const result = {
						data: format
					}
					resolve(result)
				})
				.catch(reject)
		})
	})
}

async function mangatoon(search) {
	if (!search) return "No Querry Input! Bakaa >\/\/<";
	try {
		const res = await axios.get(`https://mangatoon.mobi/en/search?word=${search}`, {
			method: "GET",
			headers: {
				"User-Agent": "Mozilla/5.0 (Linux; Android 9; Redmi 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Mobile Safari/537.36"
			}
		});
		const hasil = [];
		const $ = cheerio.load(res.data);
		$('div.recommend-item').each(function(a, b) {
			let comic_name = $(b).find('div.recommend-comics-title > span').text();
			let comic_type = $(b).find('div.comics-type > span').text().slice(1).split(/ /g).join("");
			let comic_url = $(b).find('a').attr('href');
			const result = {
				comic_name,
				comic_type,
				comic_url: 'https://mangatoon.mobi' + comic_url
			};
			hasil.push(result);
		});
		let filt = hasil.filter(v => v.comic_name !== undefined && v.comic_type !== undefined);
		return filt;
	} catch (eror404) {
		return "=> Error =>" + eror404;
	}
}

function android1(query) {
	return new Promise((resolve, reject) => {
		axios.get('https://an1.com/tags/MOD/?story=' + query + '&do=search&subaction=search')
			.then(({
				data
			}) => {
				const $ = cheerio.load(data)
				const nama = [];
				const link = [];
				const rating = [];
				const thumb = [];
				const developer = [];
				const format = [];
				$('body > div.page > div > div > div.app_list > div > div > div.cont > div.data > div.name > a > span').each(function(a, b) {
					nem = $(b).text();
					nama.push(nem)
				})
				$('div > ul > li.current-rating').each(function(c, d) {
					rat = $(d).text();
					rating.push(rat)
				})
				$('body > div.page > div > div > div.app_list > div > div > div.cont > div.data > div.developer.xsmf.muted').each(function(e, f) {
					dev = $(f).text();
					developer.push(dev)
				})
				$('body > div.page > div > div > div.app_list > div > div > div.img > img').each(function(g, h) {
					thumb.push($(h).attr('src'))
				})
				$('body > div.page > div > div > div.app_list > div > div > div.cont > div.data > div.name > a').each(function(i, j) {
					link.push($(j).attr('href'))
				})
				for (let i = 0; i < link.length; i++) {
					format.push({
						judul: nama[i],
						dev: developer[i],
						rating: rating[i],
						thumb: thumb[i],
						link: link[i]
					})
				}
				const result = {
					data: format
				}
				resolve(result)
			})
			.catch(reject)
	})
}

function wattpad(query) {
	return new Promise((resolve, reject) => {
		axios.get('https://www.wattpad.com/search/' + query)
			.then(({
				data
			}) => {
				const $ = cheerio.load(data)
				const result = [];
				const linkk = [];
				const judull = [];
				const thumb = [];
				const dibaca = [];
				const vote = [];
				const bab = [];
				$('ul.list-group > li.list-group-item').each(function(a, b) {
					linkk.push('https://www.wattpad.com' + $(b).find('a').attr('href'))
					thumb.push($(b).find('img').attr('src'))
				})
				$('div.story-card-data.hidden-xxs > div.story-info > ul > li:nth-child(1) > div.icon-container > div > span.stats-value').each(function(e, f) {
					baca = $(f).text();
					dibaca.push(baca)
				})
				$('div.story-card-data.hidden-xxs > div.story-info > ul > li:nth-child(2) > div.icon-container > div > span.stats-value').each(function(g, h) {
					vot = $(h).text();
					vote.push(vot)
				})
				$('div.story-card-data.hidden-xxs > div.story-info > ul > li:nth-child(3) > div.icon-container > div > span.stats-value').each(function(i, j) {
					bb = $(j).text();
					bab.push(bb)
				})
				$('div.story-card-data.hidden-xxs > div.story-info > div.title').each(function(c, d) {
					titel = $(d).text();
					judull.push(titel)
				})
				for (let i = 0; i < linkk.length; i++) {
					if (!judull[i] == '') {
						result.push({
							judul: judull[i],
							dibaca: dibaca[i],
							divote: vote[i],
							thumb: thumb[i],
							link: linkk[i]
						})
					}
				}
				resolve(result)
			})
			.catch(reject)
	})
}

module.exports = { PlayStore, BukaLapak, happymod, stickersearch, filmapik21, webtoons, resep, gore, mangatoon, android1, wattpad }