const movieId = '502356'; // inserisci qui l'ID del film
let apiKey;
let msg = 'Inserisci la password per accedere al servizio:';

//serve a non permettere lo zoom così sembra un app a tutti gli effetti
// attenzione: devi combinarlo con il css body{touch-action: none;}
document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
});

app();

async function checkApi() {
    let data;
    while (!data) {
        apiKey = prompt(msg);
        try {
            const response = await fetch(`https://api.themoviedb.org/3/movie/550?api_key=${apiKey}`);
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
    console.log(data);
}

async function getMovieIdByTitle(movieTitle) {
    const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${movieTitle}&language=it-IT-IT`);
    const data = await response.json();
    return data.results[0].id;
}

async function getMovieDataById(movieId) {
    const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&language=it-IT-IT`);
    const data = await response.json();
    return data;
}

async function getMediaDataById(mediaId, mediaType) {
    const response = await fetch(`https://api.themoviedb.org/3/${mediaType}/${mediaId}?api_key=${apiKey}&language=it-IT-IT`);
    const data = await response.json();
    return data;
}

async function getMediaIdByTitle(title, mediaType, resultNumber) {
    const response = await fetch(`https://api.themoviedb.org/3/search/${mediaType}?api_key=${apiKey}&query=${title}&language=it-IT-IT`);
    const data = await response.json();
    return data.results[resultNumber].id;
}

async function getHigherResImageOfMediaId(mediaId, mediaType) {
    let response = await fetch(`https://api.themoviedb.org/3/${mediaType}/${mediaId}/images?api_key=${apiKey}&include_image_language=it`);
    let data = await response.json();
    
    let posters = data.posters;

    if(posters.length <= 0){
        response = await fetch(`https://api.themoviedb.org/3/${mediaType}/${mediaId}/images?api_key=${apiKey}&include_image_language=en`);
        data = await response.json();
        
        posters = data.posters;
    }

    if(posters.length <= 0){
        response = await fetch(`https://api.themoviedb.org/3/${mediaType}/${mediaId}/images?api_key=${apiKey}`);
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
    }

    return `https://image.tmdb.org/t/p/w1280${highestResolutionImage.file_path}`;
}

async function getGenresListOf(mediaType) {
    const url = `https://api.themoviedb.org/3/genre/${mediaType}/list?api_key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.genres;
}

var scrollDiv = document.getElementsByClassName("my-bodyApp")[0];

scrollDiv.addEventListener("scroll", (e) => {
    if (scrollDiv.offsetHeight + scrollDiv.scrollTop >= scrollDiv.scrollHeight) {
        getRandomMedia("movie").then(rndMedia => {
            console.log(rndMedia.id);
            addMediaToScroll(rndMedia.id, "movie");
        });
    }
});

async function app() {  
    await checkApi();

    writeGenreSection();

    getRandomMedia("movie").then(rndMedia => {
        console.log(rndMedia.id);
        setMedias(rndMedia.id, "movie", 0);
    });
    getRandomMedia("movie").then(rndMedia => {
        console.log(rndMedia.id);
        setMedias(rndMedia.id, "movie", 1);
    });
}

let mediasCounter = 2;

function addMediaToScroll(mediaId, mediaType){
    document.getElementsByClassName("my-bodyApp")[0].innerHTML += `
        <div class="my-movieContainer d-flex flex-wrap justify-content-center align-content-start w-100">
            <div class="my-moviePoster"></div>
            <h2 class="my-movieTitle m-0 px-3">TITOLO</h2>
            <div class="my-movieBgImage"></div>
        </div>
    `;

    setMedias(mediaId, mediaType, mediasCounter);
    mediasCounter += 1;
}

const BASE_URL = 'https://api.themoviedb.org/3';

// async function getRandomMovie() {
//     const latestMovieId = await getLatestMovieId();
//     let movieDetails = null;
//     while (!movieDetails || !movieDetails.poster_path) {
//         const randomMovieId = Math.floor(Math.random() * latestMovieId) + 1;
//         movieDetails = await getMovieDetails(randomMovieId);
//     }
//     return movieDetails;
// }
  
//   async function getLatestMovieId() {
//     const url = `https://api.themoviedb.org/3/movie/latest?api_key=${apiKey}&language=it-IT`;
//     const response = await fetch(url);
//     const data = await response.json();
//     return data.id;
//   }
  
//   async function getMovieDetails(movieId) {
//       const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&language=it-IT`;
//       const response = await fetch(url);
//       if (!response.ok) {
//           return null;
//       }
//       const data = await response.json();
//       return data;
//   }

async function getRandomMedia(mediaType) {
    const totalPages = await getTotalPages(mediaType);
    const randomPage = Math.floor(Math.random() * totalPages) + 1;
    const url = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${apiKey}&language=it-IT&sort_by=popularity.desc&page=${randomPage}`;
    const response = await fetch(url);
    const data = await response.json();

    console.log(data);
    const results = data.results;
    const randomIndex = Math.floor(Math.random() * results.length);
    return results[randomIndex];
}

async function getTotalPages(mediaType) {
    return 500;
    const url = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${apiKey}&language=it-IT&sort_by=popularity.desc&page=1`;
    const response = await fetch(url);
    const data = await response.json();
    
    if(data.totalPages > 500){
        return 500;
    }

    return data.total_pages;
}

function setMedias(mediaId, mediaType, position){
    // let searchBar = document.getElementById("my-searchbar");
    // let selectMediaType = document.getElementById("my-selectMediaType");

    // let title = "Ant Man";
    // let type = "movie";

    let posterBoxesList = document.getElementsByClassName("my-moviePoster");
    let titleBoxesList = document.getElementsByClassName("my-movieTitle");
    let movieBgImagesList = document.getElementsByClassName("my-movieBgImage");
    let moviesList = document.getElementsByClassName("my-movieContainer");

    moviesList[position].setAttribute('data-id', mediaId);
    moviesList[position].setAttribute('data-type', mediaType);

    getMediaDataById(mediaId, mediaType)
        .then(media => {
            titleBoxesList[position].innerHTML = mediaType === 'movie' ? media.title : media.name;
        });
    
    getHigherResImageOfMediaId(mediaId, mediaType)
        .then(imgPath => {
            posterBoxesList[position].style.backgroundImage = `url(${imgPath})`;
            movieBgImagesList[position].style.backgroundImage = `url(${imgPath})`;
        });
}

const appContainer = document.getElementsByClassName('my-appContainer')[0];

appContainer.addEventListener('click', (event) => {
    const isToggleButton = event.target.classList.contains("my-toggleBtn");
    if (!isToggleButton) {
        return;
    } 
    
    const button = event.target;
    console.log(button);
    button.classList.toggle("my-active");
})


function toggleFilters(filterBtn){
    filterBtn.classList.toggle("my-filterBtnOpened");
    filterContainer = document.getElementsByClassName("my-filterBox")[0].querySelector('div');

    blackScreen = document.getElementsByClassName("my-blackScreen")[0];

    if(filterBtn.classList.contains('my-filterBtnOpened')){
        filterBtn.style.translate = "0 calc(-80vh + var(--filterHeight) * 2.2)";
        filterContainer.style.scale = "1 1";
        blackScreen.style.opacity = ".8";
        blackScreen.style.pointerEvents = "all";
        filterBtn.innerHTML = '<i class="fa-solid fa-arrow-down-wide-short"></i> FILTRI';
    }else{
        filterBtn.style.translate = "0 0";
        filterContainer.style.scale = "1 0";
        blackScreen.style.opacity = "0";
        blackScreen.style.pointerEvents = "none";
        filterBtn.innerHTML = '<i class="fa-solid fa-arrow-up-wide-short"></i> FILTRI';
    }
}

function writeGenreSection(){
    const genreSection = document.getElementById("my-filterGenreSection");

    getGenresListOf("movie").then(genres => {
        for(genre of genres){
            genreSection.innerHTML += `
                <button class="btn my-btn my-genreBtn my-toggleBtn text-uppercase text-center m-1" data-id="${genre.id}">${genre.name}</button>
            `;
        }

        genreSection.style.width = `${Math.ceil(genres.length / 2) * (150 + 8)}px`;
    });
}