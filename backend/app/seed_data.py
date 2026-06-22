from copy import deepcopy

from app.schemas import Collaborator, Project, ProjectSummary, ResearchSource, User


CURRENT_USER = User(
    name="Dr. Joy Aifuobhokhan",
    initials="JA",
    department="Sydani Institute for Research and Innovation",
)


SOURCE_DEFINITIONS = (
    ("pubmed", "PubMed", True),
    ("scholar", "Google Scholar", True),
    ("scopus", "Scopus", False),
    ("openalex", "OpenAlex", True),
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


PROJECTS = [
    Project(
        id="paper-1",
        title="Community health worker-led interventions for immunization coverage",
        theme="Immunization / PHC",
        researchLead="Dr. Joy Aifuobhokhan",
        framework="PICO",
        frameworkFields={
            "population": "Community health workers in underserved LGAs",
            "intervention": "Financial and non-financial retention incentives",
            "comparison": "Standard supervision or no structured incentive package",
            "outcome": "Retention, motivation, and continuity of service",
        },
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
            )
        ),
        articles=[],
        collaborators=make_collaborators("amara-okeke", "fatima-bello", "musa-ibrahim"),
    ),
    Project(
        id="paper-2",
        title="Emergency obstetric referral systems and maternal outcomes",
        theme="Maternal health",
        researchLead="Dr. Tunde Bakare",
        framework="PEO",
        frameworkFields={
            "population": "Pregnant women requiring emergency obstetric referral",
            "exposure": "Facility and system-level referral delays",
            "outcome": "Maternal outcomes and care continuity",
        },
        geography="Nigeria",
        updatedAt="5 hours ago",
        researchQuestion=(
            "What system and facility-level factors contribute to obstetric referral "
            "delays in rural LGAs?"
        ),
        sources=make_sources(
            term='("obstetric referral" AND Nigeria) OR ("maternal health" AND referral delays)'
        ),
        articles=[],
        collaborators=make_collaborators("ngozi-eze", "amara-okeke"),
    ),
    Project(
        id="paper-3",
        title="Seasonal malaria chemoprevention uptake among caregivers",
        theme="Malaria",
        researchLead="Dr. Joy Aifuobhokhan",
        framework="PICO",
        frameworkFields={
            "population": "Caregivers of children eligible for SMC",
            "intervention": "Seasonal malaria chemoprevention delivery and communication strategies",
            "comparison": "Standard delivery approaches",
            "outcome": "SMC uptake and adherence",
        },
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
        framework="PCC",
        frameworkFields={
            "population": "Adolescents in school settings",
            "concept": "School-based mental health screening models",
            "context": "West African education and health systems",
        },
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
        articles=[],
        collaborators=make_collaborators("fatima-bello", "musa-ibrahim"),
    ),
    Project(
        id="paper-5",
        title="Digital reporting burden among PHC facility staff",
        theme="Digital health",
        researchLead="SIRI Research Team",
        framework="PEO",
        frameworkFields={
            "population": "PHC facility staff",
            "exposure": "Multiple digital reporting tools",
            "outcome": "Workload, reporting behavior, and data quality",
        },
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
        frameworkFields={
            "population": "Community health supervisors",
            "intervention": "Retention incentive models",
            "comparison": "No incentive or standard management approaches",
            "outcome": "Sustained engagement and retention",
        },
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
        articles=[],
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
