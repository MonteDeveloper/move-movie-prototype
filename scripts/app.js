//! VARIABILI GLOBALI------------------------
const BASE_URL = 'https://api.themoviedb.org/3';
let API_KEY;
let msg = 'Inserisci la password per accedere al servizio:';

let mediasCounter = 0;
let currentMediaLoading = false;

let scrollDiv = document.getElementsByClassName("my-moviesContainer")[0];
let queueOfMediaTypeToLoad = [];
let nMaxMediaScroll = 10;
let eventCounter = 0;
let isAddingElements = false;
let scrollTimer = null;

const appContainer = document.getElementsByClassName('my-appContainer')[0];

//! EVENTS LISTENER--------------------------
//serve a non permettere lo zoom così sembra un app a tutti gli effetti
// attenzione: devi combinarlo con il css body{touch-action: none;}
// document.addEventListener('gesturestart', function (e) {
//     e.preventDefault();
// });

// document.addEventListener("touchstart", (e) => {
//     let lastChild = scrollDiv.lastElementChild;
//     let lastChildTop = lastChild.offsetTop;
//     let mediaItemHeight = lastChild.offsetHeight;
//     if (scrollDiv.scrollTop + scrollDiv.offsetHeight >= mediaItemHeight * 10 - (mediaItemHeight * 1.5)) {
//         addMediaToScroll();
//         addMediaToScroll();
//         eventCounter += 1;
//         console.log(eventCounter, "eventCounter");

//         console.log(mediaItemHeight * 10 - (mediaItemHeight * 4), "scrollDiv.scrollTop");
//         scrollDiv.pageYOffset  = mediaItemHeight * 10 - (mediaItemHeight * 4);
//     }
// });

let nMediaToAdd = 3;

let listMediaIdVisualized = [];

let step = nMediaToAdd / 10000;
let nowStep = step;

scrollDiv.addEventListener('scroll', function () {
    // Calcola la posizione corrente dello scroll
    let scrollTop = scrollDiv.scrollTop;
    // Calcola l'altezza totale della pagina
    let scrollHeight = scrollDiv.scrollHeight - scrollDiv.clientHeight;
    // Calcola la percentuale di scroll
    let scrollPercent = scrollTop / scrollHeight;
    // Se la percentuale di scroll è maggiore o uguale al 50%
    if (scrollPercent >= nowStep) {
        // Richiama la funzione desiderata
        addMediaToScroll();
        nowStep += step;
    }
});

appContainer.addEventListener('click', (event) => {
    const isToggleButton = event.target.classList.contains("my-btn");
    if (!isToggleButton) {
        return;
    } 
    
    const button = event.target;
    button.classList.toggle("my-active");
})

const rows = [];
let clusterize;
//! MAIN APP---------------------------------
async function main() {  
    await checkApi();

    writeGenreSection();

    // Genera 10000 righe con un'immagine per riga
    for (let i = 0; i < 10000; i++) {
        addMediaBoxToScroll();
    }

    addMediaToScroll();

    // Inizializza Clusterize.js
    clusterize = new Clusterize({
        rows,
        scrollId: 'grid',
        contentId: 'grid-content',
    });
}

main();

//! FUNCTIONS--------------------------------
async function checkApi() {
    let data;
    while (!data) {
        API_KEY = prompt(msg);
        try {
            const response = await fetch(`https://api.themoviedb.org/3/movie/550?api_key=${API_KEY}`);
            if (!response.ok) {
                throw new Error('Chiave API non valida');
            }
            data = await response.json();
        } catch (error) {
            console.error(error);
        }
        msg = "Password errata, riprova:";
    }
    // La chiave API è valida, gestisci i dati qui
}

async function getMediaDataById(mediaId, mediaType) {
    const response = await fetch(`https://api.themoviedb.org/3/${mediaType}/${mediaId}?append_to_response=videos,images,credits&language=it-IT&api_key=${API_KEY}`);
    const data = await response.json();
    return data;
}

async function getMediaIdByTitle(title, mediaType, resultNumber) {
    const response = await fetch(`https://api.themoviedb.org/3/search/${mediaType}?api_key=${API_KEY}&query=${title}&language=it-IT-IT`);
    const data = await response.json();
    return data.results[resultNumber].id;
}

async function getHigherResImageOfMediaId(mediaId, mediaType) {
    let response = await fetch(`https://api.themoviedb.org/3/${mediaType}/${mediaId}/images?api_key=${API_KEY}&include_image_language=it`);
    let data = await response.json();
    
    let posters = data.posters;

    if(posters.length <= 0){
        response = await fetch(`https://api.themoviedb.org/3/${mediaType}/${mediaId}/images?api_key=${API_KEY}&include_image_language=en`);
        data = await response.json();
        
        posters = data.posters;
    }

    if(posters.length <= 0){
        response = await fetch(`https://api.themoviedb.org/3/${mediaType}/${mediaId}/images?api_key=${API_KEY}`);
        data = await response.json();
        
        posters = data.posters;
    }

    if(posters.length <= 0){
        return "https://t4.ftcdn.net/jpg/04/99/93/31/360_F_499933117_ZAUBfv3P1HEOsZDrnkbNCt4jc3AodArl.jpg";
    }

    let highestResolutionImage = posters[0];
    for (let i = 1; i < posters.length; i++) {
        if (posters[i].width > highestResolutionImage.width) {
            highestResolutionImage = posters[i];
        }
        if(posters[i].width > 800){
            return `https://image.tmdb.org/t/p/w1280${highestResolutionImage.file_path}`;
        }
    }

    return `https://image.tmdb.org/t/p/w1280${highestResolutionImage.file_path}`;
}

async function getGenresListOfMediaType(mediaType) {
    const url = `https://api.themoviedb.org/3/genre/${mediaType}/list?api_key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.genres;
}

let mediaLoaded = 0;


function processQueue() {
    if (queueOfMediaTypeToLoad.length > 0) {
        let queueOfMediaTypeToLoadLength = queueOfMediaTypeToLoad.length;
        let mediaType = queueOfMediaTypeToLoad.shift();
        mediaLoaded += nMediaToAdd;
        addRndMediaInfoToMediaBox(mediaType, mediaLoaded);

        scrollDiv.style.overflowY = "scroll";
        if(queueOfMediaTypeToLoad.length > 0){
            scrollDiv.style.overflowY = "hidden";
        }
        setTimeout(processQueue, 1500);
    }
}

function addMediaToScroll(){
    queueOfMediaTypeToLoad.push("movie");

    if (queueOfMediaTypeToLoad.length === 1) {
        scrollDiv.style.overflowY = "hidden";
        setTimeout(processQueue, 1500);
    }
}

function addRndMediaInfoToMediaBox(mediaType, position){

    // setTimeout(() => 
    // getRndMediaOfMediaType(mediaType).then(rndMedia => {
    //     console.log(rndMedia.id);
    //     setMediaInfoToMediaBox(rndMedia.id, mediaType, position);
    // }), 2000);

    getListRndMediasOfMediaType(mediaType, nMediaToAdd).then(rndMediaList => {
        console.log(rndMediaList);
        let nowPosition = position - nMediaToAdd + 1;
        for(rndMedia of rndMediaList){
            setMediaInfoToMediaBox(rndMedia, mediaType, nowPosition);
            nowPosition += 1;
        }
        
    });

    // checkMediaLoading(mediaType);
}

function addMediaBoxToScroll(){
    mediasCounter += 1;
    rows.push(`
        <div id="media-${mediasCounter}" class="my-movieBox d-flex flex-wrap justify-content-center align-content-start w-100">
            <div class="my-moviePoster"></div>
            <h2 class="my-movieTitle m-0 px-3">
                <i class="fa-solid fa-spinner"></i>
            </h2>
            <div class="my-movieBgImage"></div>
        </div>
    `);
}

async function getRndMediaOfMediaType(mediaType) {
    const totalPages = await getTotalPages(mediaType);
    const randomPage = Math.floor(Math.random() * totalPages) + 1;
    const url = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${API_KEY}&language=it-IT&sort_by=popularity.desc&watch_region=IT&with_video=true&page=${randomPage}`;
    const response = await fetch(url);
    const data = await response.json();

    const results = data.results;
    const randomIndex = Math.floor(Math.random() * results.length);

    currentMediaLoading = false;
    return results[randomIndex];
}

// async function getListRndMediasOfMediaType(mediaType, nMedia) {
//     const totalPages = await getTotalPages(mediaType);
//     const randomPage = Math.floor(Math.random() * totalPages) + 1;
//     const url = `https://api.themoviedb.org/3/discover/${mediaType}?append_to_response=videos,images,credits&language=it-IT&api_key=${API_KEY}&sort_by=popularity.desc&watch_region=IT&with_video=true&page=${randomPage}&page_size=1000`;
//     const response = await fetch(url);
//     const data = await response.json();

//     const results = data.results;
//     console.log(results.length);
//     let randomMovies = [];
//     while (randomMovies.length < nMedia) {
//         const randomIndex = Math.floor(Math.random() * results.length);
//         if (!randomMovies.includes(results[randomIndex])) {
//             if(!listMediaIdVisualized.includes(results[randomIndex].id)){
//                 randomMovies.push(results[randomIndex]);
//                 listMediaIdVisualized.push(results[randomIndex].id);
//             }
//         }
//     }

//     currentMediaLoading = false;
//     return randomMovies;
// }

async function getListRndMediasOfMediaType(mediaType, nMedia) {

    const totalPages = await getTotalPages(mediaType);
    let randomMovies = [];
    let pagesSearched = [];
    while (randomMovies.length < nMedia && pagesSearched.length < totalPages) {
        const randomPage = Math.floor(Math.random() * totalPages) + 1;
        if (!pagesSearched.includes(randomPage)) {
            pagesSearched.push(randomPage);
            const url = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${API_KEY}&language=it-IT&sort_by=popularity.desc&watch_region=IT&with_video=true&page=${randomPage}`;
            const response = await fetch(url);
            const data = await response.json();
            const results = data.results;
            let uniqueMovies = results.filter(movie => !listMediaIdVisualized.includes(movie.id));
            while (randomMovies.length < nMedia && uniqueMovies.length > 0) {
                const randomIndex = Math.floor(Math.random() * uniqueMovies.length);
                randomMovies.push(uniqueMovies[randomIndex]);
                listMediaIdVisualized.push(uniqueMovies[randomIndex].id);
                uniqueMovies.splice(randomIndex, 1);
            }
        }
    }

    currentMediaLoading = false;
    return randomMovies;
}

async function getTrailerByMediaId(mediaId, mediaType) {
    const url = `https://api.themoviedb.org/3/${mediaType}/${mediaId}/videos?api_key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    const videos = data.results;

    let trailers = videos.filter(video => video.type === 'Trailer' && (video.iso_639_1 === 'it' || video.iso_639_1 === 'en' || video.iso_639_1 === data.original_language));
    let maxQualityTrailer = null;
    if (trailers.length > 0) {
        maxQualityTrailer = trailers.reduce((prev, current) => (prev.size > current.size) ? prev : current);
    }else{
        trailers = videos.filter(video => video.type === 'Teaser' && (video.iso_639_1 === 'it' || video.iso_639_1 === 'en' || video.iso_639_1 === data.original_language));
    }

    if (trailers.length > 0) {
        maxQualityTrailer = trailers.reduce((prev, current) => (prev.size > current.size) ? prev : current);
    }

    console.log(videos);
    if (maxQualityTrailer) {
        return `https://www.youtube.com/embed/${maxQualityTrailer.key}?enablejsapi=1`;
    }

    return null;
}

async function getTotalPages(mediaType) {
    return 500;
    const url = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${API_KEY}&language=it-IT&sort_by=popularity.desc&page=1`;
    const response = await fetch(url);
    const data = await response.json();
    
    if(data.totalPages > 500){
        return 500;
    }

    return data.total_pages;
}

function setMediaInfoToMediaBox(media, mediaType, mediaBoxPosition){
    console.log(mediaBoxPosition);
    // let media = document.getElementById(`media-${mediaBoxPosition}`);
    // let mediaChildren = media.children;
    // let posterBox = mediaChildren[0];
    // let titleBox = mediaChildren[1];
    // let movieBgImage = mediaChildren[2];

    // media.setAttribute('data-id', mediaId);
    // media.setAttribute('data-type', mediaType);

    console.log("checkTitle", mediaBoxPosition, media);
    let title = mediaType === 'movie' ? media.title : media.name;

    // getHigherResImageOfMediaId(mediaId, mediaType)
    //     .then(imgPath => {
    //         console.log("checkImage", mediaBoxPosition, mediaId);

    //         rows[mediaBoxPosition - 1] = `
    //                     <div id="media-${mediaBoxPosition}" class="my-movieBox d-flex flex-wrap justify-content-center align-content-start w-100">
    //                         <div data-media-id="${mediaId}" class="my-moviePoster" style="background-image: url('${imgPath}')" onclick="openMediaInfo(this)"></div>
    //                         <h2 class="my-movieTitle m-0 px-3">
    //                             ${title}
    //                         </h2>
    //                         <div class="my-movieBgImage"></div>
    //                     </div>
    //                 `;
    //         clusterize.update(rows);
    //     });

    console.log("checkImage", mediaBoxPosition, media);

    rows[mediaBoxPosition - 1] = `
                    <div id="media-${mediaBoxPosition}" class="my-movieBox d-flex flex-wrap justify-content-center align-content-start w-100">
                        <div data-media-id="${media.id}" class="my-moviePoster" style="background-image: url('https://image.tmdb.org/t/p/w1280${media.poster_path}')" onclick="openMediaInfo(this)"></div>
                        <h2 class="my-movieTitle m-0 px-3">
                            ${title}
                        </h2>
                        <div class="my-movieBgImage"></div>
                    </div>
                `;
    clusterize.update(rows);
}

let mediaInfoBox = document.getElementsByClassName("my-mediaInfoBox")[0];

async function getMediaProvidersByMediaId(mediaId, mediaType) {
    const response = await fetch(`https://api.themoviedb.org/3/${mediaType}/${mediaId}/watch/providers?api_key=${API_KEY}`);
    const data = await response.json();
    return data;
}

function openMediaInfo(mediaBox){
    let mediaId = mediaBox.getAttribute("data-media-id");
    console.log(mediaBox.getAttribute("data-media-id"));

    mediaInfoBox.style.opacity = "1";
    mediaInfoBox.style.pointerEvents = "all";

    if(mediaInfoBox.getAttribute("data-media-id") == mediaId){
        return;
    }

    mediaInfoBox.setAttribute("data-media-id", mediaId);

    let topBox = mediaInfoBox.getElementsByClassName("my-topBox")[0];
    let botBox = mediaInfoBox.getElementsByClassName("my-botBox")[0];

    let elMediaStream = document.getElementById("my-mediaStream");

    getMediaDataById(mediaId, "movie")
                .then(mediaData => {
                    console.log(mediaData);
                    document.getElementById("my-mediaTitle").innerHTML = mediaData.title;
                    if(mediaData.overview){
                        document.getElementById("my-mediaTrama").innerHTML = mediaData.overview;
                    }
                    topBox.style.backgroundImage = `
                        url("https://image.tmdb.org/t/p/w780${mediaData.backdrop_path}")
                    `;

                    elMediaStream.innerHTML = "";
                    getMediaProvidersByMediaId(mediaId, "movie")
                        .then(mediaProviders => {
                            console.log(mediaProviders);
                            if(mediaProviders.results.IT && mediaProviders.results.IT.flatrate){
                                for(provider of mediaProviders.results.IT.flatrate){
                                    if(
                                        provider.provider_name.toLowerCase() == "netflix" ||
                                        provider.provider_name.toLowerCase() == "amazon prime video" ||
                                        provider.provider_name.toLowerCase() == "disney plus" ||
                                        provider.provider_name.toLowerCase() == "amazon video"
                                    ){
                                        elMediaStream.innerHTML += `
                                        <button class="btn my-btn text-nowrap" onclick="openPlatStreaming('${provider.provider_name}', '${mediaData.original_title.replace("'", " ")}')">
                                            <i class="fa-solid fa-circle-play"></i>
                                            ${provider.provider_name}
                                        </button>
                                    `;
                                    } 
                                }
                            }
                            if(mediaProviders.results.IT && mediaProviders.results.IT.buy){
                                for(provider of mediaProviders.results.IT.buy){
                                    if(
                                        provider.provider_name.toLowerCase() == "netflix" ||
                                        provider.provider_name.toLowerCase() == "amazon prime video" ||
                                        provider.provider_name.toLowerCase() == "disney plus" ||
                                        provider.provider_name.toLowerCase() == "amazon video"
                                    ){
                                        elMediaStream.innerHTML += `
                                        <button class="btn my-btn text-nowrap" onclick="openPlatStreaming('${provider.provider_name}', '${mediaData.original_title.replace("'", " ")}')">
                                            <i class="fa-solid fa-circle-play"></i>
                                            ${provider.provider_name}
                                        </button>
                                    `;
                                    } 
                                }
                            }

                            
                            if(elMediaStream.innerHTML == ""){
                                elMediaStream.innerHTML = "Nessuna piattaforma streaming disponibile per questo contenuto";
                            }
                        });

                    if(mediaData.vote_average){
                        document.getElementById("my-mediaVote").innerHTML = `<strong>Valutazione: </strong>${mediaData.vote_average.toFixed(1)}/10`;
                    }
                    if(mediaData.release_date){
                        document.getElementById("my-mediaDate").innerHTML = `<strong>Data d'uscita: </strong>${mediaData.release_date.split("-").reverse().join("-")}`;
                    }
                    if(mediaData.runtime){
                        document.getElementById("my-mediaRuntime").innerHTML = `<strong>Durata: </strong>${mediaData.runtime} minuti`;
                    }
                    if(mediaData.genres.length > 0){
                        document.getElementById("my-mediaGenres").innerHTML = `<strong>Genere: </strong>`;
                        let nGenres = 0;
                        for(genre of mediaData.genres){
                            nGenres += 1;
                            if(nGenres > 1){
                                document.getElementById("my-mediaGenres").innerHTML += ", ";
                            }
                            document.getElementById("my-mediaGenres").innerHTML += genre.name;
                        }
                    }
                    

                    let trailerLink = null;
                    if (mediaData.videos && mediaData.videos.results) {
                        let italianTrailer = null;
                        let englishTrailer = null;
                        let originalTrailer = null;
                        for (let video of mediaData.videos.results) {
                            if (video.type === "Trailer") {
                                if (video.iso_639_1 === "it") {
                                    italianTrailer = `https://www.youtube.com/embed/${video.key}?enablejsapi=1`;
                                } else if (video.iso_639_1 === "en") {
                                    englishTrailer = `https://www.youtube.com/embed/${video.key}?enablejsapi=1`;
                                } else if (!originalTrailer) {
                                    originalTrailer = `https://www.youtube.com/embed/${video.key}?enablejsapi=1`;
                                }
                            }
                        }
                        trailerLink = italianTrailer || englishTrailer || originalTrailer;
                    }

                    if(trailerLink){
                        topBox.innerHTML = `
                        <iframe src="${trailerLink}"></iframe>
                        `;
                    }else{
                        getTrailerByMediaId(mediaId, "movie")
                            .then(trailer => {
                                if(trailer){
                                    console.log("TRAILER NEW METHOD!");
                                    topBox.innerHTML = `
                                    <iframe src="${trailer}"></iframe>
                                    `;
                                    topBox.style.backgroundImage = "none";
                                }else{
                                    topBox.innerHTML = '<div id="my-trailerErrorBox">Trailer non disponibile</div>';
                                }
                            })
                    }     

                    let cast = [];
                    if (mediaData.credits && mediaData.credits.cast) {
                        document.getElementById("my-mediaCast").innerHTML = "";
                        for (let member of mediaData.credits.cast) {
                            cast.push({
                                name: member.name,
                                character: member.character,
                                profilePath: `https://www.themoviedb.org/t/p/w138_and_h175_face${member.profile_path}`
                            });
                            let pathImg;
                            if(member.profile_path){
                                pathImg = `https://www.themoviedb.org/t/p/w138_and_h175_face${member.profile_path}`;
                            }else{
                                pathImg = "https://www.civictheatre.ie/wp-content/uploads/2016/05/blank-profile-picture-973460_960_720.png";
                            }
                            document.getElementById("my-mediaCast").innerHTML += 
                                `
                                <div class="my-actorProfile px-1 py-1 d-flex align-items-end bg-danger" style="background-image: url('${pathImg}');">
                                    <p class="m-0">
                                        ${member.name}<br>
                                        <small>${member.character}</small>
                                    </p>
                                </div>
                                `;
                        }
                    }
                });
}

let stopAllYouTubeVideos = () => {
    let iframes = document.querySelectorAll('iframe');
    Array.prototype.forEach.call(iframes, iframe => {
        iframe.contentWindow.postMessage(JSON.stringify({
            event: 'command',
            func: 'pauseVideo'
        }), '*');
    });
}

function openPlatStreaming(platName, mediaTitle){
    console.log(platName);
    if(platName.toLowerCase() == "netflix"){
        window.open(`https://www.netflix.com/search?q=${encodeURIComponent(mediaTitle)}`);
    }else if(platName.toLowerCase() == "amazon prime video" || platName.toLowerCase() == "amazon video"){
        window.open(`https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${encodeURIComponent(mediaTitle)}&ie=UTF8`);
    }else if(platName.toLowerCase() == "disney plus"){
        window.open(`https://www.disneyplus.com/search?q=${encodeURIComponent(mediaTitle)}`);
    }else if(platName.toLowerCase() == "now tv"){
        window.open(`https://www.nowtv.com/it/search?q=${encodeURIComponent(mediaTitle)}`);
    }
 
}

function closeMediaInfo(){
    mediaInfoBox.style.opacity = "0";
    mediaInfoBox.style.pointerEvents = "none";
    stopAllYouTubeVideos();
}

function toggleFilters(filterBtn){
    filterBox = document.getElementsByClassName("my-filterContainer")[0].querySelector('div');

    blackScreen = document.getElementsByClassName("my-blackScreen")[0];

    if(!filterBtn.classList.contains('my-active')){
        filterBtn.style.transform = "translate(0, calc(-80vh + var(--btnFilterHeight) * 2.2))";
        filterBox.style.transform = "translate(-50%, 0) scale(1, 1)";
        blackScreen.style.opacity = ".8";
        blackScreen.style.pointerEvents = "all";
        filterBtn.innerHTML = '<i class="fa-solid fa-arrow-down-wide-short"></i> FILTRI';
    }else{
        filterBtn.style.transform = "translate(0, 0)";
        filterBox.style.transform = "translate(-50%, 0) scale(1, 0)";
        blackScreen.style.opacity = "0";
        blackScreen.style.pointerEvents = "none";
        filterBtn.innerHTML = '<i class="fa-solid fa-arrow-up-wide-short"></i> FILTRI';
    }
}

function writeGenreSection(){
    const genreSection = document.getElementById("my-filterGenreSection");

    getGenresListOfMediaType("movie").then(genres => {
        for(genre of genres){
            genreSection.innerHTML += `
                <button class="btn my-btn text-uppercase text-center m-1" data-id="${genre.id}">${genre.name}</button>
            `;
        }

        genreSection.style.width = `${Math.ceil(genres.length / 2) * (150 + 8)}px`;
    });
}