const path = require('node:path');

const rootDir = path.resolve(__dirname, '..', '..');
const eventAssetsDir = path.resolve(rootDir, 'research', 'event-assets');

const sourceSeeds = {
    '1956-dartmouth': [
        {
            type: 'primary',
            label: 'Dartmouth AI proposal archive',
            url: 'https://www-formal.stanford.edu/jmc/history/dartmouth/dartmouth.html',
            usage: 'Reference source for the original 1956 proposal text.'
        },
        {
            type: 'primary-reprint',
            label: 'Wired reprint of the Dartmouth proposal',
            url: 'https://www.wired.com/2012/10/dead-media-beat-a-proposal-for-the-dartmouth-summer-research-project-on-artificial-intelligence/',
            usage: 'Readable reprint of the 1955 proposal; verify against Stanford original.'
        },
        {
            type: 'institution',
            label: 'Dartmouth College AI history note',
            url: 'https://home.dartmouth.edu/about/artificial-intelligence-ai-coined-dartmouth',
            usage: 'Institutional background and exhibit-friendly framing.'
        },
        {
            type: 'event-photo',
            label: 'IEEE Spectrum Dartmouth workshop group photo analysis',
            url: 'https://spectrum.ieee.org/dartmouth-ai-workshop',
            usage: 'Identifies the 1956 Dartmouth group photo and image credit; permission must be checked before production use.'
        },
        {
            type: 'retrospective-publication',
            label: 'AI Magazine report on AI@50',
            url: 'https://ojs.aaai.org/aimagazine/index.php/aimagazine/article/view/1911',
            usage: 'Published retrospective report for the 50th anniversary Dartmouth AI conference.'
        },
        {
            type: 'history-paper',
            label: 'IEEE Annals article on cybernetics and the Dartmouth Conference',
            url: 'https://doi.org/10.1109/MAHC.2010.44',
            usage: 'Scholarly historical analysis of the Dartmouth conference context.'
        },
        {
            type: 'archive',
            label: 'Ray Solomonoff Dartmouth notes archive',
            url: 'http://raysolomonoff.com/dartmouth/',
            usage: 'Archive hub for participant notes, attendance lists, letters, and related materials.'
        },
        {
            type: 'archive-document',
            label: 'Ray Solomonoff 1956 participant list PDF',
            url: 'http://raysolomonoff.com/dartmouth/boxbdart/dart56ray812825who.pdf',
            usage: 'Participant-list evidence from the Solomonoff archive.'
        },
        {
            type: 'archive-document',
            label: 'Trenchard More 1956 Dartmouth notes PDF',
            url: 'http://raysolomonoff.com/dartmouth/boxa/dart56more5th6thweeks.pdf',
            usage: 'Workshop notes that help reconstruct sessions and participants.'
        },
        {
            type: 'person',
            label: 'ACM A.M. Turing Award profile - John McCarthy',
            url: 'https://amturing.acm.org/award_winners/mccarthy_1118322.cfm',
            usage: 'Biographical source for John McCarthy.'
        },
        {
            type: 'person',
            label: 'Stanford obituary - John McCarthy',
            url: 'https://news.stanford.edu/stories/2011/10/john-mccarthy-obit-102511',
            usage: 'Institutional biography and legacy source for John McCarthy.'
        },
        {
            type: 'person',
            label: 'ACM A.M. Turing Award profile - Marvin Minsky',
            url: 'https://amturing.acm.org/award_winners/minsky_7440781.cfm',
            usage: 'Biographical source for Marvin Minsky.'
        },
        {
            type: 'person',
            label: 'MIT obituary - Marvin Minsky',
            url: 'https://news.mit.edu/2016/marvin-minsky-obituary-0125',
            usage: 'Institutional biography and legacy source for Marvin Minsky.'
        },
        {
            type: 'person',
            label: 'Computer History Museum fellow profile - Marvin Minsky',
            url: 'https://computerhistory.org/profile/marvin-minsky/',
            usage: 'Museum biography and potential portrait lead for Marvin Minsky.'
        },
        {
            type: 'person',
            label: 'Claude Shannon profile - IEEE Information Theory Society',
            url: 'https://www.itsoc.org/about/shannon',
            usage: 'Biographical source and image lead for Claude Shannon.'
        },
        {
            type: 'person',
            label: 'Nathaniel Rochester biography index',
            url: 'https://en.wikipedia.org/wiki/Nathaniel_Rochester_(computer_scientist)',
            usage: 'Starting point for Nathaniel Rochester biography and references.'
        },
        {
            type: 'image-search',
            label: 'Wikimedia Commons search - Dartmouth AI workshop',
            url: 'https://commons.wikimedia.org/w/index.php?search=Dartmouth+AI+workshop&title=Special:MediaSearch&type=image',
            usage: 'Open-license image candidate search; verify each file page license.'
        },
        {
            type: 'image-search',
            label: 'Wikimedia Commons category - Dartmouth Hall',
            url: 'https://commons.wikimedia.org/wiki/Category:Dartmouth_Hall',
            usage: 'Venue/background image candidates; verify period relevance and license.'
        },
        {
            type: 'image-search',
            label: 'Library of Congress search - Dartmouth College 1956',
            url: 'https://www.loc.gov/pictures/search/?q=Dartmouth%20College%201956',
            usage: 'Historical campus image candidate search; verify rights statement.'
        }
    ],
    '1957-perceptron': [
        {
            type: 'primary',
            label: 'Rosenblatt perceptron paper DOI',
            url: 'https://doi.org/10.1037/h0042519',
            usage: 'Primary paper record for the perceptron.'
        },
        {
            type: 'primary-report',
            label: 'The Perceptron: A Perceiving and Recognizing Automaton report',
            url: 'https://apps.dtic.mil/sti/citations/AD0256582',
            usage: '1957 Cornell Aeronautical Laboratory Project PARA report record.'
        },
        {
            type: 'publication',
            label: 'Principles of Neurodynamics book record',
            url: 'https://archive.org/details/principlesofneur00fran',
            usage: 'Book-length Perceptron source and publication image lead.'
        },
        {
            type: 'institution',
            label: 'Cornell Chronicle perceptron retrospective',
            url: 'https://news.cornell.edu/stories/2019/09/rosenblatts-perceptron-paved-way-ai-60-years-too-soon',
            usage: 'Institutional history and photo lead source.'
        },
        {
            type: 'artifact',
            label: 'Mark I Perceptron overview',
            url: 'https://en.wikipedia.org/wiki/Mark_I_Perceptron',
            usage: 'Artifact overview with image and references; use file page for rights review.'
        },
        {
            type: 'person',
            label: 'Frank Rosenblatt biography overview',
            url: 'https://en.wikipedia.org/wiki/Frank_Rosenblatt',
            usage: 'Biography lead for portrait/source references.'
        },
        {
            type: 'news',
            label: 'New York Times 1958 Mark I Perceptron report',
            url: 'https://www.nytimes.com/1958/07/08/archives/new-navy-device-learns-by-doing-psychologist-shows-embryo-of.html',
            usage: 'Contemporary public report; may require access.'
        }
    ],
    '1957-kmeans': [
        {
            type: 'primary',
            label: 'MacQueen k-means proceedings record',
            url: 'https://projecteuclid.org/euclid.bsmsp/1200512992',
            usage: 'Primary source for the k-means term and clustering method.'
        },
        {
            type: 'primary',
            label: 'Lloyd quantization paper DOI',
            url: 'https://doi.org/10.1109/TIT.1982.1056489',
            usage: 'Canonical Lloyd algorithm publication record.'
        },
        {
            type: 'artifact',
            label: 'Bell Labs Holmdel Complex overview',
            url: 'https://en.wikipedia.org/wiki/Bell_Labs_Holmdel_Complex',
            usage: 'Bell Labs location/background image lead; use file page for rights review.'
        },
        {
            type: 'documentation',
            label: 'scikit-learn KMeans documentation',
            url: 'https://scikit-learn.org/stable/modules/clustering.html#k-means',
            usage: 'Algorithm explanation and diagram context source.'
        },
        {
            type: 'image-source',
            label: 'Iris k-means clustering graphic - Commons file',
            url: 'https://commons.wikimedia.org/wiki/File:Iris_Flowers_Clustering_kMeans.svg',
            usage: 'Open visual candidate for k-means clustering.'
        },
        {
            type: 'background',
            label: 'Bell System Technical Journal archive copy',
            url: 'https://archive.org/details/sim_bell-system-technical-journal_1982-03_61_2',
            usage: 'Archive browsing source for Lloyd paper context.'
        }
    ]
};

const mediaSeeds = {
    '1956-dartmouth': {
        people: [
            {
                name: 'John McCarthy',
                leads: [
                    {
                        type: 'portrait-category',
                        label: 'Wikimedia Commons category - John McCarthy',
                        url: 'https://commons.wikimedia.org/wiki/Category:John_McCarthy_(computer_scientist)',
                        usage: 'Commons category with multiple portrait candidates and the Dartmouth proposal PDF.'
                    },
                    {
                        type: 'portrait-file',
                        label: 'John McCarthy Stanford portrait - Commons file',
                        url: 'https://commons.wikimedia.org/wiki/File:John_McCarthy_Stanford.jpg',
                        usage: 'Candidate portrait file page; verify license and photographer before production use.'
                    },
                    {
                        type: 'portrait-file',
                        label: 'John McCarthy Stanford 2006 - Commons file',
                        url: 'https://commons.wikimedia.org/wiki/File:John_McCarthy_(computer_scientist)_Stanford_2006_(272020300).jpg',
                        usage: 'Candidate portrait file page; verify license and date fit.'
                    }
                ]
            },
            {
                name: 'Marvin Minsky',
                leads: [
                    {
                        type: 'portrait-category',
                        label: 'Wikimedia Commons category - Marvin Minsky',
                        url: 'https://commons.wikimedia.org/wiki/Category:Marvin_Minsky',
                        usage: 'Commons category with portrait, patent, and artifact candidates.'
                    },
                    {
                        type: 'portrait-file',
                        label: 'Marvin Minsky cropped portrait - Commons file',
                        url: 'https://commons.wikimedia.org/wiki/File:Marvin_Minsky_(cropped).jpg',
                        usage: 'Candidate portrait file page; verify license and crop source.'
                    },
                    {
                        type: 'portrait-file',
                        label: 'Marvin Minsky portrait - Commons file',
                        url: 'https://commons.wikimedia.org/wiki/File:Marvin_Minsky.jpg',
                        usage: 'Candidate portrait file page; verify license and event/date context.'
                    }
                ]
            },
            {
                name: 'Claude Shannon',
                leads: [
                    {
                        type: 'portrait-category',
                        label: 'Wikimedia Commons category - Claude Shannon',
                        url: 'https://commons.wikimedia.org/wiki/Category:Claude_Shannon',
                        usage: 'Commons category with portrait, machine, publication, and artifact candidates.'
                    },
                    {
                        type: 'portrait-file',
                        label: 'C. E. Shannon Tekniska museet portrait - Commons file',
                        url: 'https://commons.wikimedia.org/wiki/File:C.E._Shannon._Tekniska_museet_43069_(cropped).jpg',
                        usage: 'Candidate portrait file page; verify museum credit and license.'
                    },
                    {
                        type: 'artifact-photo',
                        label: 'Theseus Maze by Claude Shannon - Commons file',
                        url: 'https://commons.wikimedia.org/wiki/File:Theseus_Maze_by_Claude_Shannon,_1952_-_MIT_Museum_-_DSC03702.JPG',
                        usage: 'Artifact photo candidate for Shannon context; verify MIT Museum/Commons license.'
                    }
                ]
            },
            {
                name: 'Nathaniel Rochester',
                leads: [
                    {
                        type: 'portrait-search',
                        label: 'Nathaniel Rochester IBM portrait search',
                        url: 'https://www.google.com/search?tbm=isch&q=Nathaniel%20Rochester%20IBM%20portrait',
                        usage: 'No stable open portrait found yet; use as a lead only.'
                    },
                    {
                        type: 'archive-search',
                        label: 'IBM Archives search - Nathaniel Rochester',
                        url: 'https://www.ibm.com/search?lang=en&cc=us&q=Nathaniel%20Rochester',
                        usage: 'Look for IBM-origin biography or photo leads.'
                    }
                ]
            }
        ],
        eventImages: [
            {
                type: 'event-group-photo',
                label: '1956 Dartmouth workshop group photo - IEEE Spectrum article',
                url: 'https://spectrum.ieee.org/dartmouth-ai-workshop',
                imageUrl:
                    'https://spectrum.ieee.org/media-library/black-and-white-photo-of-seven-smiling-men-sitting-on-a-lawn-in-front-of-a-tree-and-a-white-school-building-with-many-windows.jpg?id=33603728&width=2000&height=1500&coordinates=224%2C0%2C0%2C0',
                usage: 'Specific group-photo lead. Use article caption/source to verify people, credit, and permission before production use.'
            },
            {
                type: 'event-group-photo-crop',
                label: '1956 Dartmouth workshop group photo cropped variant - IEEE Spectrum media library',
                url: 'https://spectrum.ieee.org/dartmouth-ai-workshop',
                imageUrl:
                    'https://spectrum.ieee.org/media-library/historical-photo-of-seven-smiling-men-sitting-on-a-lawn-in-front-of-a-tree-and-a-white-school-building-with-many-windows.jpg?id=33603743&width=1200&height=600&coordinates=0%2C0%2C0%2C30',
                usage: 'Article social/hero crop; treat as reference-only unless explicit permission is cleared.'
            },
            {
                type: 'venue-photo-category',
                label: 'Dartmouth Hall venue/background candidates - Commons category',
                url: 'https://commons.wikimedia.org/wiki/Category:Dartmouth_Hall',
                usage: 'Open-license venue/background candidates; verify exact file license and period fit.'
            },
            {
                type: 'campus-photo-category',
                label: 'Dartmouth College photo candidates - Commons category',
                url: 'https://commons.wikimedia.org/wiki/Category:Dartmouth_College',
                usage: 'Campus image pool for contextual backgrounds; verify each file page.'
            },
            {
                type: 'archive-photo-search',
                label: 'Library of Congress Dartmouth College photo search',
                url: 'https://www.loc.gov/pictures/search/?q=Dartmouth%20College',
                usage: 'Historical campus photo search; verify rights statement.'
            }
        ],
        publications: [
            {
                type: 'publication-scan',
                label: 'Dartmouth proposal PDF - Commons file',
                url: 'https://commons.wikimedia.org/wiki/File:A_Proposal_for_the_Dartmouth_Summer_Research_Project_on_Artificial_Intelligence,_by_John_McCarthy_et_al,_1955.pdf',
                usage: 'Candidate source for proposal-cover visual; verify file page license and source.'
            },
            {
                type: 'publication-image',
                label: 'The Mathematical Theory of Communication title page - Commons file',
                url: 'https://commons.wikimedia.org/wiki/File:The_Mathematical_Theory_Of_Communication_title_page.jpg',
                usage: 'Contextual publication image for Claude Shannon; verify relevance and license.'
            }
        ]
    },
    '1957-perceptron': {
        people: [
            {
                name: 'Frank Rosenblatt',
                leads: [
                    {
                        type: 'portrait-search',
                        label: 'Frank Rosenblatt Cornell portrait search',
                        url: 'https://www.google.com/search?tbm=isch&q=Frank%20Rosenblatt%20Cornell%20portrait',
                        usage: 'Use as lead only; verify original source and rights.'
                    },
                    {
                        type: 'bio-search',
                        label: 'Cornell Frank Rosenblatt biography/photo search',
                        url: 'https://www.google.com/search?q=site%3Acornell.edu%20Frank%20Rosenblatt%20photo',
                        usage: 'Institutional portrait/photo lead.'
                    }
                ]
            }
        ],
        eventImages: [
            {
                type: 'artifact-page',
                label: 'Mark I Perceptron artifact page',
                url: 'https://en.wikipedia.org/wiki/Mark_I_Perceptron',
                usage: 'Artifact image lead; review linked file page before production use.'
            },
            {
                type: 'institution-photo',
                label: 'Cornell Chronicle perceptron retrospective photo lead',
                url: 'https://news.cornell.edu/stories/2019/09/rosenblatts-perceptron-paved-way-ai-60-years-too-soon',
                usage: 'Likely institution-controlled photo lead; rights must be checked.'
            }
        ],
        publications: [
            {
                type: 'publication-record',
                label: 'The Perceptron Psychological Review DOI',
                url: 'https://doi.org/10.1037/h0042519',
                usage: 'Primary paper record.'
            },
            {
                type: 'publication-record',
                label: 'Principles of Neurodynamics archive record',
                url: 'https://archive.org/details/principlesofneur00fran',
                usage: 'Book cover/scan candidate; rights must be checked.'
            }
        ]
    },
    '1957-kmeans': {
        people: [
            {
                name: 'Stuart Lloyd',
                leads: [
                    {
                        type: 'portrait-search',
                        label: 'Stuart Lloyd Bell Labs portrait search',
                        url: 'https://www.google.com/search?tbm=isch&q=Stuart%20Lloyd%20Bell%20Labs%20portrait',
                        usage: 'Use as lead only; verify original source and rights.'
                    }
                ]
            }
        ],
        eventImages: [
            {
                type: 'institution-photo',
                label: 'Bell Labs Holmdel Complex image lead',
                url: 'https://en.wikipedia.org/wiki/Bell_Labs_Holmdel_Complex',
                usage: 'Institution/background image lead; review linked file page before production use.'
            },
            {
                type: 'diagram-file',
                label: 'Iris k-means clustering graphic - Commons file',
                url: 'https://commons.wikimedia.org/wiki/File:Iris_Flowers_Clustering_kMeans.svg',
                usage: 'Open visual candidate for explaining clustering.'
            }
        ],
        publications: [
            {
                type: 'publication-record',
                label: 'MacQueen k-means proceedings record',
                url: 'https://projecteuclid.org/euclid.bsmsp/1200512992',
                usage: 'Primary source for the k-means term.'
            },
            {
                type: 'publication-record',
                label: 'Lloyd quantization paper DOI',
                url: 'https://doi.org/10.1109/TIT.1982.1056489',
                usage: 'Canonical Lloyd algorithm publication record.'
            }
        ]
    }
};

const searchTemplates = [
    {
        type: 'web',
        label: 'General source search',
        url: 'https://www.google.com/search?q={query}'
    },
    {
        type: 'image',
        label: 'Image candidate search',
        url: 'https://www.google.com/search?tbm=isch&q={query}'
    },
    {
        type: 'scholar',
        label: 'Scholar source search',
        url: 'https://scholar.google.com/scholar?q={query}'
    }
];

module.exports = {
    rootDir,
    eventAssetsDir,
    sourceSeeds,
    mediaSeeds,
    searchTemplates,
    fetch: {
        timeoutMs: 15000,
        imageTimeoutMs: 45000,
        userAgent: 'AI-History-Show research collector; source audit for local exhibition content'
    },
    reviewServer: {
        host: '127.0.0.1',
        port: 8010
    }
};
