<?php

namespace Infomediji\FluentTable;

enum ButtonStyle: string
{
    // Solid
    case Primary = 'primary';
    case Secondary = 'secondary';
    case Success = 'success';
    case Danger = 'danger';
    case Warning = 'warning';
    case Info = 'info';

    // Outline
    case OutlinePrimary = 'outline-primary';
    case OutlineSecondary = 'outline-secondary';
    case OutlineSuccess = 'outline-success';
    case OutlineDanger = 'outline-danger';
    case OutlineWarning = 'outline-warning';

    // Ghost (best for table cells — minimal visual weight)
    case GhostPrimary = 'ghost-primary';
    case GhostSecondary = 'ghost-secondary';
    case GhostSuccess = 'ghost-success';
    case GhostDanger = 'ghost-danger';
    case GhostWarning = 'ghost-warning';
}
