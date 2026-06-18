from copy import deepcopy

from app.schemas import Article, Collaborator, Project, ProjectSummary, ResearchSource, User


CURRENT_USER = User(
    name="Dr. Joy Aifuobhokhan",
    initials="JA",
    department="Sydani Institute for Research and Innovation",
)


SOURCE_DEFINITIONS = (
    ("pubmed", "PubMed", True),
    ("scholar", "Google Scholar", True),
    ("scopus", "Scopus", False),
)


COLLABORATOR_POOL = {
    "tunde-bakare": Collaborator(
        id="tunde-bakare",
        name="Dr. Tunde Bakare",
        initials="TB",
    ),
    "amara-okeke": Collaborator(
        id="amara-okeke",
        name="Dr. Amara Okeke",
        initials="AO",
    ),
    "ngozi-eze": Collaborator(
        id="ngozi-eze",
        name="Ngozi Eze",
        initials="NE",
    ),
    "fatima-bello": Collaborator(
        id="fatima-bello",
        name="Fatima Bello",
        initials="FB",
    ),
    "musa-ibrahim": Collaborator(
        id="musa-ibrahim",
        name="Musa Ibrahim",
        initials="MI",
    ),
}


def make_collaborators(*collaborator_ids: str) -> list[Collaborator]:
    return [deepcopy(COLLABORATOR_POOL[collaborator_id]) for collaborator_id in collaborator_ids]


def make_sources(
    *,
    term: str = "",
    result_counts: dict[str, int] | None = None,
    last_runs: dict[str, str] | None = None,
) -> list[ResearchSource]:
    result_counts = result_counts or {}
    last_runs = last_runs or {}

    return [
        ResearchSource(
            id=source_id,
            name=name,
            enabled=enabled,
            resultCount=result_counts.get(source_id, 0),
            lastRun=last_runs.get(source_id, ""),
            searchTerm=term if index == 0 else "",
        )
        for index, (source_id, name, enabled) in enumerate(SOURCE_DEFINITIONS)
    ]


BASE_ARTICLES = (
    {
        "id": "art-1",
        "source": "PubMed",
        "title": "Retention factors for frontline health workers in low-resource settings",
        "author": "Okeke A; Bello F",
        "doi": "10.1016/j.healthpol.2024.104920",
        "year": "2024",
        "journal": "Health Policy and Planning",
        "abstract": (
            "This study evaluates financial incentives, supervision quality, and career "
            "development as predictors of frontline health worker retention across "
            "low-resource settings."
        ),
    },
    {
        "id": "art-2",
        "source": "Google Scholar",
        "title": "Retention factors for frontline health workers in low-resource settings",
        "author": "Okeke A; Bello F",
        "doi": "10.1016/j.healthpol.2024.104920",
        "year": "2024",
        "journal": "Health Policy and Planning",
        "abstract": (
            "This study evaluates financial incentives, supervision quality, and career "
            "development as predictors of frontline health worker retention across "
            "low-resource settings."
        ),
    },
    {
        "id": "art-3",
        "source": "PubMed",
        "title": "Community health worker motivation and sustained participation in Nigeria",
        "author": "Aifuobhokhan J; Musa I",
        "doi": "10.1186/s12913-023-09914-2",
        "year": "2023",
        "journal": "BMC Health Services Research",
        "abstract": (
            "A qualitative assessment of community health worker motivation, stipend "
            "reliability, workload, social recognition, and supervision in Northern Nigeria."
        ),
    },
    {
        "id": "art-4",
        "source": "Google Scholar",
        "title": "Non-financial incentives and community health workforce retention",
        "author": "Bakare T; Eze N",
        "doi": "10.1093/heapol/czad081",
        "year": "2023",
        "journal": "Health Policy and Planning",
        "abstract": (
            "The article compares recognition, supervision, training, and peer support "
            "models used to retain community-based health workers."
        ),
    },
)


def make_article(
    index: int,
    *,
    id_suffix: str = "",
    selected: bool = False,
    full_text_status: str = "Not pulled",
    review_decision: str = "Unreviewed",
) -> Article:
    data = deepcopy(BASE_ARTICLES[index])
    if id_suffix:
        data["id"] = f"{data['id']}{id_suffix}"
    return Article(
        **data,
        fullTextStatus=full_text_status,
        selected=selected,
        reviewDecision=review_decision,
    )


SCREENING_ARTICLE_ROWS = (
    ("Validation of the SDQ for adolescent mental health screening in schools", "PubMed", "Adeleke R; Mensah K", "2022", "10.1001/jamapediatrics.2022.1101", "JAMA Pediatrics"),
    ("Validation of the SDQ for adolescent mental health screening in schools", "Google Scholar", "Adeleke R; Mensah K", "2022", "10.1001/jamapediatrics.2022.1101", "JAMA Pediatrics"),
    ("Teacher-administered screening tools for adolescent depression", "PubMed", "Nwosu A; Okafor C", "2021", "10.1016/j.jad.2021.04.012", "Journal of Affective Disorders"),
    ("Feasibility of school-based mental health screening in low-income settings", "Scopus", "Eze N; Bello F", "2023", "10.1186/s12888-023-04567-8", "BMC Psychiatry"),
    ("Stepped-care models for adolescent anxiety in schools", "Google Scholar", "Yusuf Z; Obi E", "2020", "10.1192/bjp.2020.45", "British Journal of Psychiatry"),
    ("Digital screening apps for youth mental health: a systematic review", "PubMed", "Ibrahim M; Okeke A", "2023", "10.2196/38291", "JMIR mHealth"),
    ("Cultural adaptation of mental health screening for West African adolescents", "Scopus", "Mensah K; Eze N", "2022", "10.1371/journal.pgph.0000123", "PLOS Global Public Health"),
    ("Parent versus self-report in adolescent depression screening", "PubMed", "Bakare T; Nwosu A", "2019", "10.1097/CHI.0000000000000345", "J. Am. Acad. Child Psychiatry"),
    ("Feasibility of school-based mental health screening in low-income settings", "PubMed", "Eze N; Bello F", "2023", "10.1186/s12888-023-04567-8", "BMC Psychiatry"),
    ("School counselor capacity for mental health referrals", "Google Scholar", "Obi E; Yusuf Z", "2021", "10.1080/02667363.2021.190000", "Educational Psychology in Practice"),
    ("Universal versus targeted screening approaches in secondary schools", "PubMed", "Okafor C; Adeleke R", "2022", "10.1111/camh.12500", "Child and Adolescent Mental Health"),
    ("Cost-effectiveness of school mental health screening programs", "Scopus", "Bello F; Musa I", "2020", "10.1007/s10488-020-01034-1", "Adm. Policy Ment. Health"),
    ("Adolescent suicide-risk screening: ethical considerations", "PubMed", "Aifuobhokhan J; Bakare T", "2023", "10.1001/jamapsychiatry.2023.0456", "JAMA Psychiatry"),
    ("Implementation barriers for screening in resource-limited schools", "Google Scholar", "Eze N; Okeke A", "2021", "10.1093/heapol/czab055", "Health Policy and Planning"),
)


def make_screening_articles() -> list[Article]:
    return [
        Article(
            id=f"scr-{index + 1}",
            title=title,
            source=source,
            author=author,
            year=year,
            doi=doi,
            journal=journal,
            abstract="",
            fullTextStatus="Not pulled",
            selected=index not in (1, 8),
            reviewDecision="Unreviewed",
        )
        for index, (title, source, author, year, doi, journal) in enumerate(SCREENING_ARTICLE_ROWS)
    ]


PROJECTS = [
    Project(
        id="paper-1",
        title="Community health worker-led interventions for immunization coverage",
        theme="Immunization / PHC",
        researchLead="Dr. Joy Aifuobhokhan",
        framework="PICO",
        geography="Northern Nigeria",
        updatedAt="Just now",
        researchQuestion=(
            "What financial and non-financial factors influence retention of trained "
            "community health workers in underserved LGAs?"
        ),
        sources=make_sources(
            term=(
                '("community health workers" AND retention AND Nigeria) OR '
                '("frontline health workers" AND incentives AND "low-resource settings") OR '
                '("community health workforce" AND motivation AND supervision)'
            ),
            result_counts={"pubmed": 2, "scholar": 2},
            last_runs={"pubmed": "2026-06-17", "scholar": "2026-06-17"},
        ),
        articles=[
            make_article(0, selected=True, full_text_status="Pulled", review_decision="Included"),
            make_article(1),
            make_article(2, selected=True, full_text_status="Pulled"),
            make_article(3, selected=True, full_text_status="Pulled"),
        ],
        collaborators=make_collaborators("amara-okeke", "fatima-bello", "musa-ibrahim"),
    ),
    Project(
        id="paper-2",
        title="Emergency obstetric referral systems and maternal outcomes",
        theme="Maternal health",
        researchLead="Dr. Tunde Bakare",
        framework="PEO",
        geography="Nigeria",
        updatedAt="5 hours ago",
        researchQuestion=(
            "What system and facility-level factors contribute to obstetric referral "
            "delays in rural LGAs?"
        ),
        sources=make_sources(
            term='("obstetric referral" AND Nigeria) OR ("maternal health" AND referral delays)'
        ),
        articles=[make_article(0, id_suffix="-mh"), make_article(1, id_suffix="-mh")],
        collaborators=make_collaborators("ngozi-eze", "amara-okeke"),
    ),
    Project(
        id="paper-3",
        title="Seasonal malaria chemoprevention uptake among caregivers",
        theme="Malaria",
        researchLead="Dr. Joy Aifuobhokhan",
        framework="PICO",
        geography="Sahel region",
        updatedAt="Yesterday",
        researchQuestion=(
            "What caregiver, delivery, and communication factors affect SMC uptake in "
            "Sahel communities?"
        ),
        sources=make_sources(
            term='("seasonal malaria chemoprevention" AND uptake) OR ("SMC" AND caregivers AND Sahel)'
        ),
        articles=[],
    ),
    Project(
        id="paper-4",
        title="School-based adolescent mental health screening models",
        theme="Mental health",
        researchLead="Ngozi Eze",
        framework="SPIDER",
        geography="West Africa",
        updatedAt="3 days ago",
        researchQuestion=(
            "Which school-based screening models are feasible for adolescent mental "
            "health programs in West Africa?"
        ),
        sources=make_sources(
            term=(
                '("school-based" AND "mental health screening" AND adolescents) OR '
                '("adolescent mental health" AND West Africa)'
            )
        ),
        articles=make_screening_articles(),
        collaborators=make_collaborators("fatima-bello", "musa-ibrahim"),
    ),
    Project(
        id="paper-5",
        title="Digital reporting burden among PHC facility staff",
        theme="Digital health",
        researchLead="SIRI Research Team",
        framework="PEO",
        geography="Nigeria",
        updatedAt="Last week",
        researchQuestion=(
            "How does the use of multiple digital reporting tools affect PHC staff "
            "workload and data quality?"
        ),
        sources=make_sources(),
        articles=[],
    ),
    Project(
        id="paper-6",
        title="Retention incentives for community health supervisors",
        theme="Health workforce",
        researchLead="Dr. Joy Aifuobhokhan",
        framework="PICO",
        geography="Nigeria",
        updatedAt="2 weeks ago",
        researchQuestion=(
            "Which incentive models are associated with sustained engagement among "
            "community health supervisors?"
        ),
        sources=make_sources(
            term=(
                '("community health supervisors" AND incentives) OR '
                '("health workforce" AND retention AND Nigeria)'
            )
        ),
        articles=[
            make_article(
                0,
                id_suffix="-complete",
                selected=True,
                full_text_status="Pulled",
                review_decision="Included",
            ),
            make_article(1, id_suffix="-complete"),
            make_article(
                2,
                id_suffix="-complete",
                selected=True,
                full_text_status="Pulled",
                review_decision="Excluded",
            ),
        ],
    ),
]


def get_project_summaries() -> list[ProjectSummary]:
    stage_labels = {
        "idea": "Ideation",
        "search": "Search",
        "dedupe": "Selection",
        "retrieval": "Retrieval",
        "review": "Review",
    }
    stage_ids = tuple(stage_labels)

    summaries = []
    for project in PROJECTS:
        selected = [article for article in project.articles if article.selected]
        reviewed = [
            article
            for article in selected
            if article.review_decision in {"Included", "Maybe", "Excluded"}
        ]
        terms = {source.search_term.strip() for source in project.sources if source.search_term.strip()}

        if reviewed:
            stage_id = "review"
        elif any(article.full_text_status == "Pulled" for article in selected):
            stage_id = "retrieval"
        elif selected:
            stage_id = "dedupe"
        elif project.articles or terms:
            stage_id = "search"
        else:
            stage_id = "idea"

        stage_number = stage_ids.index(stage_id) + 1
        fully_reviewed = bool(selected) and len(reviewed) == len(selected)
        status = (
            "Archived"
            if project.archived
            else "Ideation"
            if stage_id == "idea"
            else "Complete"
            if stage_id == "review" and fully_reviewed
            else "In progress"
        )

        summaries.append(
            ProjectSummary(
                id=project.id,
                title=project.title,
                theme=project.theme,
                researchLead=project.research_lead,
                framework=project.framework,
                geography=project.geography,
                updatedAt=project.updated_at,
                stageId=stage_id,
                stageLabel=stage_labels[stage_id],
                stageNumber=stage_number,
                progress=max(1, round(stage_number / len(stage_ids) * 100)),
                status=status,
                collaborators=project.collaborators,
                archived=project.archived,
            )
        )

    return summaries


def get_project(project_id: str) -> Project | None:
    return next((deepcopy(project) for project in PROJECTS if project.id == project_id), None)
