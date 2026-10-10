<?php

$markdownExamEnvFile = dirname(__DIR__) . '/.env';
$markdownExamFileEnv = [];

if (is_readable($markdownExamEnvFile)) {
    $markdownExamLines = file($markdownExamEnvFile, FILE_IGNORE_NEW_LINES);
    if (is_array($markdownExamLines)) {
        foreach ($markdownExamLines as $markdownExamLine) {
            $markdownExamLine = trim($markdownExamLine);
            if ($markdownExamLine === '' || $markdownExamLine[0] === '#') {
                continue;
            }
            if (strncmp($markdownExamLine, 'export ', 7) === 0) {
                $markdownExamLine = trim(substr($markdownExamLine, 7));
            }
            $markdownExamEq = strpos($markdownExamLine, '=');
            if ($markdownExamEq === false) {
                continue;
            }
            $markdownExamKey = trim(substr($markdownExamLine, 0, $markdownExamEq));
            $markdownExamValue = trim(substr($markdownExamLine, $markdownExamEq + 1));
            if (!preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $markdownExamKey)) {
                continue;
            }
            $markdownExamLength = strlen($markdownExamValue);
            if ($markdownExamLength >= 2) {
                $markdownExamQuote = $markdownExamValue[0];
                if (($markdownExamQuote === '"' || $markdownExamQuote === "'") && $markdownExamValue[$markdownExamLength - 1] === $markdownExamQuote) {
                    $markdownExamValue = substr($markdownExamValue, 1, -1);
                }
            }
            $markdownExamFileEnv[$markdownExamKey] = $markdownExamValue;
        }
    }
}

$markdownExamEnv = function ($key, $default) use ($markdownExamFileEnv) {
    $fromProcess = getenv($key);
    if ($fromProcess !== false && $fromProcess !== '') {
        return $fromProcess;
    }
    if (isset($markdownExamFileEnv[$key]) && $markdownExamFileEnv[$key] !== '') {
        return $markdownExamFileEnv[$key];
    }

    return $default;
};

return [
    'search_engines' => [
        [
            'name' => 'Bing',
            'url' => 'https://www.bing.com/search?q=',
            'default' => true
        ],
        [
            'name' => 'yandex',
            'url' => 'https://yandex.com/search/?text=',
            'default' => true
        ],
        [
            'name' => 'Google',
            'url' => 'https://www.google.com/search?q='
        ],
        [
            'name' => 'DuckDuckGo',
            'url' => 'https://duckduckgo.com/?q='
        ],
        [
            'name' => 'Yahoo',
            'url' => 'https://search.yahoo.com/search?p='
        ],
        [
            'name' => 'Ask',
            'url' => 'https://www.ask.com/web?q='
        ],
        [
            'name' => 'Yandex',
            'url' => 'https://yandex.com/search/?text='
        ]
    ],
    'admin_keyword' => $markdownExamEnv('ADMIN_KEYWORD', '1+1=3'),
    'admin_redirect' => $markdownExamEnv('ADMIN_REDIRECT', '/admin/index.php')
];