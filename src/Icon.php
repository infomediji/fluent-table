<?php

namespace Infomediji\FluentTable;

enum Icon: string
{
    // CRUD
    case Edit = 'edit';
    case Delete = 'trash';
    case View = 'eye';
    case Add = 'plus';
    case Copy = 'copy';
    case Save = 'device-floppy';

    // Files
    case Download = 'download';
    case Upload = 'upload';
    case File = 'file';
    case FileCsv = 'file-spreadsheet';

    // Status
    case Check = 'check';
    case X = 'x';
    case Ban = 'ban';
    case Lock = 'lock';
    case Unlock = 'lock-open';
    case Refresh = 'refresh';
    case Clock = 'clock';

    // Navigation
    case ExternalLink = 'external-link';
    case ArrowRight = 'arrow-right';
    case ChevronDown = 'chevron-down';

    // Misc
    case Settings = 'settings';
    case Info = 'info-circle';
    case Alert = 'alert-circle';
    case Dots = 'dots-vertical';
    case Inbox = 'inbox';
    case Search = 'search';
    case Filter = 'filter';
    case User = 'user';
    case Star = 'star';
    case Send = 'send';
    case Mail = 'mail';
}
