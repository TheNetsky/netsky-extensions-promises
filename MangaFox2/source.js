(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Sources = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
"use strict";
/**
 * Request objects hold information for a particular source (see sources for example)
 * This allows us to to use a generic api to make the calls against any source
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Source = void 0;
class Source {
    constructor(cheerio) {
        // <-----------        OPTIONAL METHODS        -----------> //
        /**
         * Manages the ratelimits and the number of requests that can be done per second
         * This is also used to fetch pages when a chapter is downloading
         */
        this.requestManager = createRequestManager({
            requestsPerSecond: 2.5,
            requestTimeout: 5000
        });
        this.cheerio = cheerio;
    }
    /**
     * (OPTIONAL METHOD) This function is called when ANY request is made by the Paperback Application out to the internet.
     * By modifying the parameter and returning it, the user can inject any additional headers, cookies, or anything else
     * a source may need to load correctly.
     * The most common use of this function is to add headers to image requests, since you cannot directly access these requests through
     * the source implementation itself.
     *
     * NOTE: This does **NOT** influence any requests defined in the source implementation. This function will only influence requests
     * which happen behind the scenes and are not defined in your source.
     */
    globalRequestHeaders() { return {}; }
    globalRequestCookies() { return []; }
    /**
     * A stateful source may require user input.
     * By supplying this value to the Source, the app will render your form to the user
     * in the application settings.
     */
    getAppStatefulForm() { return createUserForm({ formElements: [] }); }
    /**
     * When the Advanced Search is rendered to the user, this skeleton defines what
     * fields which will show up to the user, and returned back to the source
     * when the request is made.
     */
    getAdvancedSearchForm() { return createUserForm({ formElements: [] }); }
    /**
     * (OPTIONAL METHOD) Given a manga ID, return a URL which Safari can open in a browser to display.
     * @param mangaId
     */
    getMangaShareUrl(mangaId) { return null; }
    /**
     * If a source is secured by Cloudflare, this method should be filled out.
     * By returning a request to the website, this source will attempt to create a session
     * so that the source can load correctly.
     * Usually the {@link Request} url can simply be the base URL to the source.
     */
    getCloudflareBypassRequest() { return null; }
    /**
     * (OPTIONAL METHOD) A function which communicates with a given source, and returns a list of all possible tags which the source supports.
     * These tags are generic and depend on the source. They could be genres such as 'Isekai, Action, Drama', or they can be
     * listings such as 'Completed, Ongoing'
     * These tags must be tags which can be used in the {@link searchRequest} function to augment the searching capability of the application
     */
    getTags() { return Promise.resolve(null); }
    /**
     * (OPTIONAL METHOD) A function which should scan through the latest updates section of a website, and report back with a list of IDs which have been
     * updated BEFORE the supplied timeframe.
     * This function may have to scan through multiple pages in order to discover the full list of updated manga.
     * Because of this, each batch of IDs should be returned with the mangaUpdatesFoundCallback. The IDs which have been reported for
     * one page, should not be reported again on another page, unless the relevent ID has been detected again. You do not want to persist
     * this internal list between {@link Request} calls
     * @param mangaUpdatesFoundCallback A callback which is used to report a list of manga IDs back to the API
     * @param time This function should find all manga which has been updated between the current time, and this parameter's reported time.
     *             After this time has been passed, the system should stop parsing and return
     */
    filterUpdatedManga(mangaUpdatesFoundCallback, time, ids) { return Promise.resolve(); }
    /**
     * (OPTIONAL METHOD) A function which should readonly allf the available homepage sections for a given source, and return a {@link HomeSection} object.
     * The sectionCallback is to be used for each given section on the website. This may include a 'Latest Updates' section, or a 'Hot Manga' section.
     * It is recommended that before anything else in your source, you first use this sectionCallback and send it {@link HomeSection} objects
     * which are blank, and have not had any requests done on them just yet. This way, you provide the App with the sections to render on screen,
     * which then will be populated with each additional sectionCallback method called. This is optional, but recommended.
     * @param sectionCallback A callback which is run for each independant HomeSection.
     */
    getHomePageSections(sectionCallback) { return Promise.resolve(); }
    /**
     * (OPTIONAL METHOD) This function will take a given homepageSectionId and metadata value, and with this information, should return
     * all of the manga tiles supplied for the given state of parameters. Most commonly, the metadata value will contain some sort of page information,
     * and this request will target the given page. (Incrementing the page in the response so that the next call will return relevent data)
     * @param homepageSectionId The given ID to the homepage defined in {@link getHomePageSections} which this method is to readonly moreata about
     * @param metadata This is a metadata parameter which is filled our in the {@link getHomePageSections}'s return
     * function. Afterwards, if the metadata value returned in the {@link PagedResults} has been modified, the modified version
     * will be supplied to this function instead of the origional {@link getHomePageSections}'s version.
     * This is useful for keeping track of which page a user is on, pagnating to other pages as ViewMore is called multiple times.
     */
    getViewMoreItems(homepageSectionId, metadata) { return Promise.resolve(null); }
    /**
     * (OPTIONAL METHOD) This function is to return the entire library of a manga website, page by page.
     * If there is an additional page which needs to be called, the {@link PagedResults} value should have it's metadata filled out
     * with information needed to continue pulling information from this website.
     * Note that if the metadata value of {@link PagedResults} is undefined, this method will not continue to run when the user
     * attempts to readonly morenformation
     * @param metadata Identifying information as to what the source needs to call in order to readonly theext batch of data
     * of the directory. Usually this is a page counter.
     */
    getWebsiteMangaDirectory(metadata) { return Promise.resolve(null); }
    // <-----------        PROTECTED METHODS        -----------> //
    // Many sites use '[x] time ago' - Figured it would be good to handle these cases in general
    convertTime(timeAgo) {
        var _a;
        let time;
        let trimmed = Number(((_a = /\d*/.exec(timeAgo)) !== null && _a !== void 0 ? _a : [])[0]);
        trimmed = (trimmed == 0 && timeAgo.includes('a')) ? 1 : trimmed;
        if (timeAgo.includes('minutes')) {
            time = new Date(Date.now() - trimmed * 60000);
        }
        else if (timeAgo.includes('hours')) {
            time = new Date(Date.now() - trimmed * 3600000);
        }
        else if (timeAgo.includes('days')) {
            time = new Date(Date.now() - trimmed * 86400000);
        }
        else if (timeAgo.includes('year') || timeAgo.includes('years')) {
            time = new Date(Date.now() - trimmed * 31556952000);
        }
        else {
            time = new Date(Date.now());
        }
        return time;
    }
    /**
     * When a function requires a POST body, it always should be defined as a JsonObject
     * and then passed through this function to ensure that it's encoded properly.
     * @param obj
     */
    urlEncodeObject(obj) {
        let ret = {};
        for (const entry of Object.entries(obj)) {
            ret[encodeURIComponent(entry[0])] = encodeURIComponent(entry[1]);
        }
        return ret;
    }
}
exports.Source = Source;

},{}],3:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Source"), exports);

},{"./Source":2}],4:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./base"), exports);
__exportStar(require("./models"), exports);
__exportStar(require("./APIWrapper"), exports);

},{"./APIWrapper":1,"./base":3,"./models":25}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],6:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],7:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],8:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageCode = void 0;
var LanguageCode;
(function (LanguageCode) {
    LanguageCode["UNKNOWN"] = "_unknown";
    LanguageCode["BENGALI"] = "bd";
    LanguageCode["BULGARIAN"] = "bg";
    LanguageCode["BRAZILIAN"] = "br";
    LanguageCode["CHINEESE"] = "cn";
    LanguageCode["CZECH"] = "cz";
    LanguageCode["GERMAN"] = "de";
    LanguageCode["DANISH"] = "dk";
    LanguageCode["ENGLISH"] = "gb";
    LanguageCode["SPANISH"] = "es";
    LanguageCode["FINNISH"] = "fi";
    LanguageCode["FRENCH"] = "fr";
    LanguageCode["WELSH"] = "gb";
    LanguageCode["GREEK"] = "gr";
    LanguageCode["CHINEESE_HONGKONG"] = "hk";
    LanguageCode["HUNGARIAN"] = "hu";
    LanguageCode["INDONESIAN"] = "id";
    LanguageCode["ISRELI"] = "il";
    LanguageCode["INDIAN"] = "in";
    LanguageCode["IRAN"] = "ir";
    LanguageCode["ITALIAN"] = "it";
    LanguageCode["JAPANESE"] = "jp";
    LanguageCode["KOREAN"] = "kr";
    LanguageCode["LITHUANIAN"] = "lt";
    LanguageCode["MONGOLIAN"] = "mn";
    LanguageCode["MEXIAN"] = "mx";
    LanguageCode["MALAY"] = "my";
    LanguageCode["DUTCH"] = "nl";
    LanguageCode["NORWEGIAN"] = "no";
    LanguageCode["PHILIPPINE"] = "ph";
    LanguageCode["POLISH"] = "pl";
    LanguageCode["PORTUGUESE"] = "pt";
    LanguageCode["ROMANIAN"] = "ro";
    LanguageCode["RUSSIAN"] = "ru";
    LanguageCode["SANSKRIT"] = "sa";
    LanguageCode["SAMI"] = "si";
    LanguageCode["THAI"] = "th";
    LanguageCode["TURKISH"] = "tr";
    LanguageCode["UKRAINIAN"] = "ua";
    LanguageCode["VIETNAMESE"] = "vn";
})(LanguageCode = exports.LanguageCode || (exports.LanguageCode = {}));

},{}],10:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],11:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MangaStatus = void 0;
var MangaStatus;
(function (MangaStatus) {
    MangaStatus[MangaStatus["ONGOING"] = 1] = "ONGOING";
    MangaStatus[MangaStatus["COMPLETED"] = 0] = "COMPLETED";
})(MangaStatus = exports.MangaStatus || (exports.MangaStatus = {}));

},{}],13:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],14:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],15:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],16:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],17:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],18:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],19:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],20:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],21:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagType = void 0;
/**
 * An enumerator which {@link SourceTags} uses to define the color of the tag rendered on the website.
 * Five types are available: blue, green, grey, yellow and red, the default one is blue.
 * Common colors are red for (Broken), yellow for (+18), grey for (Country-Proof)
 */
var TagType;
(function (TagType) {
    TagType["BLUE"] = "default";
    TagType["GREEN"] = "success";
    TagType["GREY"] = "info";
    TagType["YELLOW"] = "warning";
    TagType["RED"] = "danger";
})(TagType = exports.TagType || (exports.TagType = {}));

},{}],22:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],23:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],24:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],25:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Chapter"), exports);
__exportStar(require("./ChapterDetails"), exports);
__exportStar(require("./HomeSection"), exports);
__exportStar(require("./Manga"), exports);
__exportStar(require("./MangaTile"), exports);
__exportStar(require("./RequestObject"), exports);
__exportStar(require("./SearchRequest"), exports);
__exportStar(require("./TagSection"), exports);
__exportStar(require("./SourceTag"), exports);
__exportStar(require("./Languages"), exports);
__exportStar(require("./Constants"), exports);
__exportStar(require("./MangaUpdate"), exports);
__exportStar(require("./PagedResults"), exports);
__exportStar(require("./ResponseObject"), exports);
__exportStar(require("./RequestManager"), exports);
__exportStar(require("./RequestHeaders"), exports);
__exportStar(require("./SourceInfo"), exports);
__exportStar(require("./TrackObject"), exports);
__exportStar(require("./OAuth"), exports);
__exportStar(require("./UserForm"), exports);

},{"./Chapter":6,"./ChapterDetails":5,"./Constants":7,"./HomeSection":8,"./Languages":9,"./Manga":12,"./MangaTile":10,"./MangaUpdate":11,"./OAuth":13,"./PagedResults":14,"./RequestHeaders":15,"./RequestManager":16,"./RequestObject":17,"./ResponseObject":18,"./SearchRequest":19,"./SourceInfo":20,"./SourceTag":21,"./TagSection":22,"./TrackObject":23,"./UserForm":24}],26:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MangaFox2 = exports.MangaFox2Info = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const MangaFox2Parser_1 = require("./MangaFox2Parser");
const FF_DOMAIN = 'https://fanfox.net';
const FF_DOMAIN_MOBILE = 'https://m.fanfox.net';
const method = 'GET';
const headers = {
    "content-type": "application/x-www-form-urlencoded"
};
exports.MangaFox2Info = {
    version: '1.0.5',
    name: 'MangaFox2',
    icon: 'icon.png',
    author: 'Netsky <3 Sirus',
    authorWebsite: 'https://github.com/TheNetsky',
    description: 'Extension that pulls manga from Fanfox aka Mangafox.',
    hentaiSource: false,
    websiteBaseURL: FF_DOMAIN,
    sourceTags: [
        {
            text: "Notifications",
            type: paperback_extensions_common_1.TagType.GREEN
        }
    ]
};
class MangaFox2 extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.cookies = [createCookie({ name: 'isAdult', value: '1', domain: "fanfox.net" })];
    }
    getMangaShareUrl(mangaId) { return `${FF_DOMAIN}/manga/${mangaId}`; }
    ;
    getMangaDetails(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: `${FF_DOMAIN}/manga/`,
                method,
                param: mangaId,
                cookies: this.cookies
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            return MangaFox2Parser_1.parseMangaDetails($, mangaId);
        });
    }
    getChapters(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: `${FF_DOMAIN}/manga/`,
                method,
                param: mangaId,
                cookies: this.cookies
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            return MangaFox2Parser_1.parseChapters($, mangaId);
        });
    }
    getChapterDetails(mangaId, chapterId) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: `${FF_DOMAIN_MOBILE}/roll_manga/${mangaId}/${chapterId}`,
                method: "GET",
                cookies: this.cookies
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            return MangaFox2Parser_1.parseChapterDetails($, mangaId, chapterId);
        });
    }
    filterUpdatedManga(mangaUpdatesFoundCallback, time, ids) {
        return __awaiter(this, void 0, void 0, function* () {
            let page = 1;
            let updatedManga = {
                ids: [],
                loadMore: true
            };
            while (updatedManga.loadMore) {
                const request = createRequestObject({
                    url: `${FF_DOMAIN}/releases/${page++}.html`,
                    method,
                    cookies: this.cookies
                });
                const response = yield this.requestManager.schedule(request, 1);
                const $ = this.cheerio.load(response.data);
                updatedManga = MangaFox2Parser_1.parseUpdatedManga($, time, ids);
                if (updatedManga.ids.length > 0) {
                    mangaUpdatesFoundCallback({
                        ids: updatedManga.ids
                    });
                }
            }
        });
    }
    getHomePageSections(sectionCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            let section1 = createHomeSection({ id: 'hot_update', title: 'Hot Manga Releases', view_more: true });
            let section2 = createHomeSection({ id: 'being_read', title: 'Being Read Right Now' });
            let section3 = createHomeSection({ id: 'new_manga', title: 'New Manga Releases', view_more: true });
            let section4 = createHomeSection({ id: 'latest_updates', title: 'Latest Updates', view_more: true });
            const sections = [section1, section2, section3, section4];
            const request = createRequestObject({
                url: FF_DOMAIN,
                method,
                cookies: this.cookies
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            MangaFox2Parser_1.parseHomeSections($, sections, sectionCallback);
        });
    }
    getViewMoreItems(homepageSectionId, metadata) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            let param = '';
            switch (homepageSectionId) {
                case "hot_update":
                    param = `/hot/`;
                    break;
                case "new_manga":
                    param = `/directory/${page}.html?news`;
                    break;
                case "latest_updates":
                    param = `/releases/${page}.html`;
                    break;
                default:
                    return Promise.resolve(null);
                    ;
            }
            const request = createRequestObject({
                url: `${FF_DOMAIN}`,
                method,
                param,
                cookies: this.cookies
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            const manga = MangaFox2Parser_1.parseViewMore($, homepageSectionId);
            metadata = !MangaFox2Parser_1.isLastPage($) ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: manga,
                metadata
            });
        });
    }
    searchRequest(query, metadata) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            const search = MangaFox2Parser_1.generateSearch(query);
            const request = createRequestObject({
                url: `${FF_DOMAIN}/search?`,
                method,
                headers,
                cookies: this.cookies,
                param: `page=${page}${search}`
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            const manga = MangaFox2Parser_1.parseSearch($);
            metadata = !MangaFox2Parser_1.isLastPage($) ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: manga,
                metadata
            });
        });
    }
    getTags() {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: `${FF_DOMAIN}/search?`,
                method,
                cookies: this.cookies,
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            return MangaFox2Parser_1.parseTags($);
        });
    }
}
exports.MangaFox2 = MangaFox2;

},{"./MangaFox2Parser":27,"paperback-extensions-common":4}],27:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLastPage = exports.parseTags = exports.parseViewMore = exports.parseSearch = exports.generateSearch = exports.parseHomeSections = exports.parseUpdatedManga = exports.parseChapterDetails = exports.parseChapters = exports.parseMangaDetails = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
exports.parseMangaDetails = ($, mangaId) => {
    var _a;
    const tagRegexp = new RegExp('\\/directory\\/(.*)\\/');
    const image = (_a = $('.detail-info-cover-img', $('.detail-info-cover')).attr('src')) !== null && _a !== void 0 ? _a : '';
    const details = $('.detail-info');
    const title = $('span.detail-info-right-title-font', details).text().trim();
    const rawStatus = $('.detail-info-right-title-tip', details).text().trim();
    const rating = $('span.item-score', details).text().trim().replace(',', '.');
    const author = $('p.detail-info-right-say a', details).text().trim();
    let hentai = false;
    const description = $('p.fullcontent').text().trim();
    const titles = [];
    titles.push(title);
    let arrayTags = [];
    $('a', '.detail-info-right-tag-list').each((i, tag) => {
        const id = $(tag).attr('href').match(tagRegexp)[1];
        const label = $(tag).text().trim();
        if (["Adult", "Smut", "Mature"].includes(label))
            hentai = true;
        arrayTags.push({ id: id, label: label });
    });
    let status = paperback_extensions_common_1.MangaStatus.ONGOING;
    switch (rawStatus) {
        case 'Ongoing':
            status = paperback_extensions_common_1.MangaStatus.ONGOING;
            break;
        case 'Completed':
            status = paperback_extensions_common_1.MangaStatus.COMPLETED;
            break;
        default:
            status = paperback_extensions_common_1.MangaStatus.ONGOING;
            break;
    }
    let tagSections = [createTagSection({ id: '0', label: 'genres', tags: arrayTags.map(x => createTag(x)) })];
    return createManga({
        id: mangaId,
        titles: titles,
        image,
        rating: Number(rating),
        status: status,
        author: author,
        tags: tagSections,
        desc: description,
        hentai: hentai
    });
};
exports.parseChapters = ($, mangaId) => {
    var _a, _b;
    const chapters = [];
    const rawChapters = $('div#chapterlist ul li').children('a').toArray().reverse();
    const chapterIdRegex = new RegExp('\\/manga\\/[a-zA-Z0-9_]*\\/(.*)\\/');
    const chapterNumberRegex = new RegExp('c([0-9.]+)');
    const volumeRegex = new RegExp('Vol.(\\d+)');
    for (let element of rawChapters) {
        const title = (_a = $('p.title3', element).html()) !== null && _a !== void 0 ? _a : '';
        const date = parseDate((_b = $('p.title2', element).html()) !== null && _b !== void 0 ? _b : '');
        const chapterId = element.attribs['href'].match(chapterIdRegex)[1];
        const chapterNumber = Number("0" + chapterId.match(chapterNumberRegex)[1]);
        const volMatch = title.match(volumeRegex);
        const volume = volMatch != null && volMatch.length > 0 ? Number(volMatch[1]) : undefined;
        chapters.push(createChapter({
            id: chapterId,
            mangaId,
            name: title,
            langCode: paperback_extensions_common_1.LanguageCode.ENGLISH,
            chapNum: chapterNumber,
            time: date,
            volume: volume
        }));
    }
    return chapters;
};
exports.parseChapterDetails = ($, mangaId, chapterId) => {
    const pages = [];
    const rawPages = $('div#viewer').children('img').toArray();
    for (let page of rawPages) {
        let url = page.attribs['data-original'];
        if (url.startsWith("//")) {
            url = "https:" + url;
        }
        pages.push(url);
    }
    let chapterDetails = createChapterDetails({
        id: chapterId,
        mangaId: mangaId,
        pages: pages,
        longStrip: false
    });
    return chapterDetails;
};
exports.parseUpdatedManga = ($, time, ids) => {
    const updatedManga = [];
    let loadMore = true;
    const idRegExp = new RegExp('\\/manga\\/(.*)\\/');
    const panel = $(".manga-list-4.mt15");
    for (let obj of $('.manga-list-4-list > li', panel).toArray()) {
        const id = $('a', obj).first().attr('href').match(idRegExp)[1];
        const dateContext = $('.manga-list-4-item-subtitle', $(obj));
        const date = $('span', dateContext).text();
        const mangaDate = parseDate(date);
        if (mangaDate > time)
            if (ids.includes(id))
                updatedManga.push(id);
            else
                loadMore = false;
    }
    return {
        ids: updatedManga,
        loadMore,
    };
};
exports.parseHomeSections = ($, sections, sectionCallback) => {
    for (const section of sections)
        sectionCallback(section);
    const hotManga = [];
    const beingReadManga = [];
    const newManga = [];
    const latestManga = [];
    const idRegExp = new RegExp('\\/manga\\/(.*)\\/');
    const firstSection = $('div.main-large').first();
    const hotMangas = $('.manga-list-1', firstSection).first();
    const beingReadMangas = hotMangas.next();
    const newMangas = $('div.line-list');
    const latestMangas = $('ul.manga-list-4-list');
    for (let manga of $('li', hotMangas).toArray()) {
        const id = $('a', manga).first().attr('href').match(idRegExp)[1];
        const image = $('img', manga).first().attr('src');
        const title = $('.manga-list-1-item-title', manga).text().trim();
        const subtitle = $('.manga-list-1-item-subtitle', manga).text().trim();
        if (typeof id === 'undefined')
            return;
        hotManga.push(createMangaTile({
            id: id,
            image: image,
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    for (let manga of $('li', beingReadMangas).toArray()) {
        const id = $('a', manga).first().attr('href').match(idRegExp)[1];
        const image = $('img', manga).first().attr('src');
        const title = $('.manga-list-1-item-title', manga).text().trim();
        const subtitle = $('.manga-list-1-item-subtitle', manga).text().trim();
        if (typeof id === 'undefined')
            return;
        beingReadManga.push(createMangaTile({
            id: id,
            image: image,
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    for (let manga of $('li', newMangas).toArray()) {
        const id = $('a', manga).first().attr('href').match(idRegExp)[1];
        const image = $('img', manga).first().attr('src');
        const title = $('.manga-list-1-item-title', manga).text().trim();
        const subtitle = $('.manga-list-1-item-subtitle', manga).text().trim();
        if (typeof id === 'undefined')
            return;
        newManga.push(createMangaTile({
            id: id,
            image: image,
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    for (let manga of $('.manga-list-4-list > li', latestMangas).toArray()) {
        const id = $('a', manga).first().attr('href').match(idRegExp)[1];
        const image = $('img', manga).first().attr('src');
        const title = $('.manga-list-4-item-title', manga).text().trim();
        const subtitle = $('.manga-list-4-item-subtitle', manga).text().trim();
        if (typeof id === 'undefined')
            return;
        latestManga.push(createMangaTile({
            id: id,
            image: image,
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    sections[0].items = hotManga;
    sections[1].items = beingReadManga;
    sections[2].items = newManga;
    sections[3].items = latestManga;
    for (const section of sections)
        sectionCallback(section);
};
exports.generateSearch = (query) => {
    var _a;
    let search = (_a = query.title) !== null && _a !== void 0 ? _a : "";
    search = search.replace(/\s+/g, "+");
    search = `&title&genres&nogenres&sort&stype=1&name=${search}&type=0&author_method=cw&author&artist_method=cw&artist&rating_method=eq&rating&released_method=eq&released&st=0`;
    return search;
};
exports.parseSearch = ($) => {
    const mangas = [];
    const collectedIds = [];
    const idRegExp = new RegExp('\\/manga\\/(.*)\\/');
    $('ul.manga-list-4-list').children('li').each((i, manga) => {
        const id = $('a', manga).first().attr('href').match(idRegExp)[1];
        const image = $('img', manga).first().attr('src');
        const title = $('p.manga-list-4-item-title a', manga).first().text().trim();
        const tips = $('p.manga-list-4-item-tip', manga).toArray();
        const author = $('a', tips[0]).text().trim();
        const lastUpdate = $('a', tips[1]).text().trim();
        const shortDesc = $(tips[2]).text().trim();
        if (typeof id === 'undefined')
            return;
        if (!collectedIds.includes(id)) {
            mangas.push(createMangaTile({
                id,
                image: image,
                title: createIconText({ text: title !== null && title !== void 0 ? title : '' }),
                subtitleText: createIconText({ text: author !== null && author !== void 0 ? author : '' }),
                primaryText: createIconText({ text: shortDesc !== null && shortDesc !== void 0 ? shortDesc : '' }),
                secondaryText: createIconText({ text: lastUpdate !== null && lastUpdate !== void 0 ? lastUpdate : '' }),
            }));
            collectedIds.push(id);
        }
    });
    return mangas;
};
exports.parseViewMore = ($, homepageSectionId) => {
    var _a, _b;
    const manga = [];
    const idRegExp = new RegExp('\\/manga\\/(.*)\\/');
    if (homepageSectionId === "latest_updates") {
        const collectedIds = [];
        const panel = $(".manga-list-4.mt15");
        for (let p of $('.manga-list-4-list > li', panel).toArray()) {
            const id = $('a', p).first().attr('href').match(idRegExp)[1];
            const image = (_a = $('img', p).first().attr('src')) !== null && _a !== void 0 ? _a : "";
            const title = $('.manga-list-4-item-title', p).text().trim();
            const subtitle = $('.manga-list-4-item-subtitle', p).text().trim();
            if (typeof id === 'undefined')
                continue;
            if (!collectedIds.includes(id)) {
                manga.push(createMangaTile({
                    id,
                    image,
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
                collectedIds.push(id);
            }
        }
        return manga;
    }
    else {
        const collectedIds = [];
        const panel = $('.manga-list-1');
        for (let p of $('li', panel).toArray()) {
            const id = $('a', p).first().attr('href').match(idRegExp)[1];
            const image = (_b = $('img', p).first().attr('src')) !== null && _b !== void 0 ? _b : '';
            const title = $('.manga-list-1-item-title', p).text().trim();
            const subtitle = $('.manga-list-1-item-subtitle', p).text().trim();
            if (typeof id === 'undefined')
                continue;
            if (!collectedIds.includes(id)) {
                manga.push(createMangaTile({
                    id,
                    image,
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
                collectedIds.push(id);
            }
        }
        return manga;
    }
};
//Might need to add some types too!
exports.parseTags = ($) => {
    var _a;
    const tagSections = [createTagSection({ id: '0', label: 'genres', tags: [] })];
    for (const p of $('a', $(".tag-box", `.browse-bar-filter-list-line-content`)).toArray()) {
        tagSections[0].tags.push(createTag({ id: (_a = $(p).text()) !== null && _a !== void 0 ? _a : '', label: $(p).text() }));
    }
    return tagSections;
};
const parseDate = (date) => {
    let dateObj;
    if (date.includes("Today")) {
        dateObj = new Date();
    }
    else if (date.includes("Yesterday")) {
        dateObj = new Date();
        dateObj.setDate(dateObj.getDate() - 1);
    }
    else if (date.includes("hour")) {
        let hour = Number.parseInt(date.match("[0-9]*")[0]);
        if (hour == null) {
            hour = 0;
        }
        dateObj = new Date();
        dateObj.setHours(dateObj.getHours() - hour);
    }
    else if (date.includes("minute")) {
        let minute = Number.parseInt(date.match("[0-9]*")[0]);
        if (minute == null) {
            minute = 0;
        }
        dateObj = new Date();
        dateObj.setMinutes(dateObj.getMinutes() - minute);
    }
    else if (date.includes("second")) {
        let second = Number.parseInt(date.match("[0-9]*")[0]);
        if (second == null) {
            second = 0;
        }
        dateObj = new Date();
        dateObj.setSeconds(dateObj.getSeconds() - second);
    }
    else {
        dateObj = new Date(date);
    }
    return dateObj;
};
exports.isLastPage = ($) => {
    let isLast = false;
    const current = Number($("a.active", ".pager-list-left").text());
    let lastPage = [];
    for (const p of $("a", ".pager-list-left").toArray()) {
        let page = Number($(p).text());
        if (isNaN(page))
            continue;
        lastPage.push(page);
    }
    lastPage = lastPage.sort((a, b) => b - a);
    if (!current || !lastPage[0] || current >= lastPage[0])
        isLast = true;
    return isLast;
};

},{"paperback-extensions-common":4}]},{},[26])(26)
});
