document.addEventListener('DOMContentLoaded', (event) => {
    applyFiltersFromQueryString();
    fetchAndDisplayNews();
    updateFilterCount();

    const filterForm = document.getElementById('filterForm');
    const closeButton = document.getElementById('closeModal');
    const cancelButton = document.getElementById('cancel');

    if (filterForm) {
        filterForm.addEventListener('submit', applyFilters);
    }

    if (closeButton) {
        closeButton.addEventListener('click', closeFilterModal);
    }

    if (cancelButton) {
        cancelButton.addEventListener('click', closeFilterModal);
    }
});

function openFilterModal() {
    document.getElementById('filterModal').showModal();
}

function closeFilterModal() {
    document.getElementById('filterModal').close();
}

function resetFilters() {
    const form = document.getElementById('filterForm');
    form.reset();
    window.history.replaceState({}, '', window.location.pathname);
    fetchAndDisplayNews();
}

function applyFiltersFromQueryString() {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of params.entries()) {
        const element = document.querySelector(`[name="${key}"]`);
        if (element) {
            element.value = value;
        }
    }
}

function applyFilters(event) {
    event.preventDefault();
    const form = document.getElementById('filterForm');
    const formData = new FormData(form);
    const params = new URLSearchParams(formData);
    const url = new URL(window.location.href);
    url.search = params.toString();
    window.history.replaceState({}, '', url);
    fetchAndDisplayNews();
    closeFilterModal();
    updateFilterCount();
}

function updateFilterCount() {
    const params = new URLSearchParams(window.location.search);
    const filterCount = params.toString() ? params.toString().split('&').length : 0;
    const filterCountElement = document.getElementById('filterCount');
    if (filterCountElement) {
        filterCountElement.textContent = filterCount;
    }
}

async function fetchAndDisplayNews() {
    const params = new URLSearchParams(window.location.search);
    const tipo = params.get('tipo') || '';
    const quantidade = params.get('quantidade') || '10';
    const de = params.get('de') || '';
    const ate = params.get('ate') || '';
    const busca = params.get('busca') || '';
    const page = params.get('pagina') || '1';

    let apiUrl = `https://servicodados.ibge.gov.br/api/v3/noticias/?qtd=${quantidade}&page=${page}`;
    if (tipo) {
        apiUrl += `&tipo=${tipo}`;
    }
    if (de) {
        apiUrl += `&de=${de}`;
    }
    if (ate) {
        apiUrl += `&ate=${ate}`;
    }
    if (busca) {
        apiUrl += `&busca=${busca}`;
    }

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Falha ao buscar notícias');
        }
        const data = await response.json();
        displayNews(data.items);
        setupPagination(data.count, quantidade, page);
    } catch (error) {
        console.error('Erro ao buscar notícias:', error);
    }
}

function displayNews(newsItems) {
    const newsContainer = document.getElementById('news-container');
    if (!newsContainer) return;

    newsContainer.innerHTML = '';

    if (!newsItems.length) {
        newsContainer.textContent = 'Nenhuma notícia encontrada.';
        return;
    }

    newsItems.forEach(item => {
        const article = document.createElement('article');
        article.classList.add('news-article');

        const image = document.createElement('img');
        image.src = item.imagens ? `https://agenciadenoticias.ibge.gov.br/${JSON.parse(item.imagens).image_intro}` : 'path/to/default/image.jpg';
        image.alt = item.imagens ? item.titulo : 'Imagem da notícia';
        
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('content');

        const title = document.createElement('h2');
        title.textContent = item.titulo;

        const intro = document.createElement('p');
        intro.textContent = item.introducao;

        const readMoreButton = document.createElement('button');
        readMoreButton.textContent = 'Leia Mais';
        readMoreButton.addEventListener('click', () => {
            window.open(item.link, '_blank');
        });

        const daysSincePublished = document.createElement('span');
        daysSincePublished.classList.add('days-since-published');
        const days = calculateDaysSince(item.data_publicacao);
        daysSincePublished.textContent = `Publicado há ${days}`;
        
        const editorias = document.createElement('p');
        if (Array.isArray(item.editorias)) {
            editorias.textContent = item.editorias.map(editoria => `#${editoria}`).join(' ');
        } else {
            editorias.textContent = `#${item.editorias}`;
        }

        contentDiv.appendChild(title);
        contentDiv.appendChild(intro);
        contentDiv.appendChild(readMoreButton);
        contentDiv.appendChild(editorias);
        article.appendChild(image);
        article.appendChild(contentDiv);
        article.appendChild(daysSincePublished);

        newsContainer.appendChild(article);
    });
}

function calculateDaysSince(publicationDate) {
    if (!publicationDate) return "data desconhecida";

    const [datePart, timePart] = publicationDate.split(' ');
    const [day, month, year] = datePart.split('/');
    const formattedDate = `${year}-${month}-${day}T${timePart}`;
    const publication = new Date(formattedDate);

    if (isNaN(publication)) {
        console.error('Data de publicação inválida:', publicationDate);
        return "data inválida";
    }
    
    const now = new Date();
    const diffTime = Math.abs(now - publication);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "hoje";
    if (diffDays === 1) return "ontem";
    return `${diffDays} dias`;
}

function setupPagination(totalResults, itemsPerPage, currentPage) {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';

    const totalPages = Math.ceil(totalResults / itemsPerPage);
    const currentPageNumber = parseInt(currentPage);

    let startPage = Math.max(currentPageNumber - 5, 1);
    let endPage = Math.min(currentPageNumber + 4, totalPages);

    if (currentPageNumber - 5 < 1) {
        endPage = Math.min(10, totalPages);
    }
    if (currentPageNumber + 4 > totalPages) {
        startPage = Math.max(totalPages - 9, 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.classList.add('page-button');
        if (i === currentPageNumber) {
            pageButton.classList.add('active');
        }
        pageButton.addEventListener('click', () => {
            setPage(i);
        });

        const listItem = document.createElement('li');
        listItem.appendChild(pageButton);
        paginationContainer.appendChild(listItem);
    }
}

function setPage(pageNumber) {
    const params = new URLSearchParams(window.location.search);
    params.set('pagina', pageNumber);

    const url = new URL(window.location.href);
    url.search = params.toString();
    window.history.replaceState({}, '', url);

    fetchAndDisplayNews();
}
