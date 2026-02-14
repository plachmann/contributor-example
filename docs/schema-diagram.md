# Database Schema

## ER Diagram

```mermaid
erDiagram
    users {
        UUID id PK
        VARCHAR email UK
        VARCHAR display_name
        VARCHAR avatar_url
        BOOLEAN is_admin
        TIMESTAMP created_at
    }
    campaigns {
        UUID id PK
        VARCHAR title
        TEXT description
        INTEGER budget_per_user
        TIMESTAMP open_date
        TIMESTAMP close_date
        UUID created_by FK
        TIMESTAMP created_at
    }
    campaign_participants {
        UUID id PK
        UUID campaign_id FK
        UUID user_id FK
        TIMESTAMP created_at
    }
    gifts {
        UUID id PK
        UUID campaign_id FK
        UUID giver_id FK
        UUID recipient_id FK
        INTEGER amount
        TEXT comment
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    users ||--o{ campaigns : "creates"
    users ||--o{ campaign_participants : "participates"
    campaigns ||--o{ campaign_participants : "has"
    users ||--o{ gifts : "gives"
    users ||--o{ gifts : "receives"
    campaigns ||--o{ gifts : "contains"
```

## Key Constraints

- **campaign_participants**: Unique on `(campaign_id, user_id)` — a user can only join a campaign once
- **gifts**: Unique on `(campaign_id, giver_id, recipient_id)` — one gift per recipient per campaign
- All monetary amounts stored in **cents** (integer) to avoid floating-point issues
- UUIDs used for all primary keys
