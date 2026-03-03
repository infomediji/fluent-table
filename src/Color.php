<?php

namespace Infomediji\FluentTable;

enum Color: string
{
    // Semantic
    case Primary = 'primary';
    case Secondary = 'secondary';
    case Success = 'success';
    case Danger = 'danger';
    case Warning = 'warning';
    case Info = 'info';
    case Light = 'light';
    case Dark = 'dark';
    case Muted = 'muted';

    // Tabler extended palette
    case Blue = 'blue';
    case Azure = 'azure';
    case Indigo = 'indigo';
    case Purple = 'purple';
    case Pink = 'pink';
    case Red = 'red';
    case Orange = 'orange';
    case Yellow = 'yellow';
    case Lime = 'lime';
    case Green = 'green';
    case Teal = 'teal';
    case Cyan = 'cyan';
}
