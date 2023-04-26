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

let step = 1 / 10000;
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

    for(let i = 0; i < 5; i++){
        addMediaToScroll();
    }

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
    const response = await fetch(`https://api.themoviedb.org/3/${mediaType}/${mediaId}?api_key=${API_KEY}&language=it-IT-IT`);
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
    // while(queueOfMediaTypeToLoad.length > nMaxMediaScroll){
    //     queueOfMediaTypeToLoad.shift()
    // }
    if (queueOfMediaTypeToLoad.length > 0) {
        let queueOfMediaTypeToLoadLength = queueOfMediaTypeToLoad.length;
        let mediaType = queueOfMediaTypeToLoad.shift();
        mediaLoaded += 1;
        addRndMediaInfoToMediaBox(mediaType, mediaLoaded);
        setTimeout(processQueue, 3000);
    }
}

function addMediaToScroll(){
    // let currentScrollTop = scrollDiv.scrollTop;
    // Controlla il numero di elementi "my-movieContainer"
    // addMediaBoxToScroll();
    // let movieContainers = scrollDiv.querySelectorAll(".my-movieBox");
    // if (movieContainers.length > nMaxMediaScroll) {
    //     // Rimuovi il primo elemento e aggiorna la posizione dello scroll
    //     let firstChild = movieContainers[0];
    //     let lastChild = movieContainers[movieContainers.length - 1];
    //     let lastChildHeight = lastChild.offsetHeight;
    //     firstChild.remove();
    //     scrollDiv.scrollTop = currentScrollTop - lastChildHeight;
    //     setTimeout(() => {
    //         isAddingElements = false;
    //     }, 100);
    // }
    queueOfMediaTypeToLoad.push("movie");

    if (queueOfMediaTypeToLoad.length === 1) {
        setTimeout(processQueue, 3000);
    }
}

function addRndMediaInfoToMediaBox(mediaType, position){

    setTimeout(() => 
    getRndMediaOfMediaType(mediaType).then(rndMedia => {
        console.log(rndMedia.id);
        setMediaInfoToMediaBox(rndMedia.id, mediaType, position);
    }), 2000);

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
    const url = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${API_KEY}&language=it-IT&sort_by=popularity.desc&page=${randomPage}`;
    const response = await fetch(url);
    const data = await response.json();

    const results = data.results;
    const randomIndex = Math.floor(Math.random() * results.length);

    currentMediaLoading = false;
    return results[randomIndex];
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

function setMediaInfoToMediaBox(mediaId, mediaType, mediaBoxPosition){
    console.log(mediaBoxPosition);
    // let media = document.getElementById(`media-${mediaBoxPosition}`);
    // let mediaChildren = media.children;
    // let posterBox = mediaChildren[0];
    // let titleBox = mediaChildren[1];
    // let movieBgImage = mediaChildren[2];

    // media.setAttribute('data-id', mediaId);
    // media.setAttribute('data-type', mediaType);

    

    getMediaDataById(mediaId, mediaType)
        .then(media => {
            console.log("checkTitle", mediaBoxPosition, mediaId);
            let title = mediaType === 'movie' ? media.title : media.name;

            getHigherResImageOfMediaId(mediaId, mediaType)
                .then(imgPath => {
                    console.log("checkImage", mediaBoxPosition, mediaId);

                    rows[mediaBoxPosition - 1] = `
                        <div id="media-${mediaBoxPosition}" class="my-movieBox d-flex flex-wrap justify-content-center align-content-start w-100">
                            <div class="my-moviePoster" style="background-image: url('${imgPath}')"></div>
                            <h2 class="my-movieTitle m-0 px-3">
                                ${title}
                            </h2>
                            <div class="my-movieBgImage"></div>
                        </div>
                    `;
                    clusterize.update(rows);
                });
        });
    
    

    
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