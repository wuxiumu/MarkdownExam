<?php

function examJson($payload, $statusCode = 200)
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function parseFrontMatterValue($value)
{
    $value = trim($value);

    if (preg_match('/^\[(.*)\]$/', $value, $matches)) {
        if (trim($matches[1]) === '') {
            return [];
        }

        return array_map(function ($item) {
            return trim($item, " \t\n\r\0\x0B\"'");
        }, explode(',', $matches[1]));
    }

    if (preg_match('/^["\'](.*)["\']$/', $value, $matches)) {
        return $matches[1];
    }

    return $value;
}

function parseFrontMatter($content)
{
    if (!preg_match('/^---\s*\n(.*?)\n---\s*\n(.*)$/s', $content, $matches)) {
        return [[], $content];
    }

    $metadata = [];
    foreach (explode("\n", $matches[1]) as $line) {
        if (preg_match('/^\s*([\w-]+)\s*:\s*(.*)$/u', $line, $field)) {
            $metadata[trim($field[1])] = parseFrontMatterValue($field[2]);
        }
    }

    return [$metadata, $matches[2]];
}

function normalizeAnswer($answer)
{
    if ($answer === null || trim($answer) === '') {
        return [];
    }

    return array_values(array_filter(array_map(function ($item) {
        return strtoupper(trim($item));
    }, preg_split('/[,，\s]+/u', $answer))));
}

function parseOptionLines($text)
{
    $options = [];
    foreach (explode("\n", trim($text)) as $line) {
        $line = trim($line);
        if (preg_match('/^-?\s*([A-Z])[\.\、]\s*(.+)$/u', $line, $matches)) {
            $options[] = [
                'key' => strtoupper($matches[1]),
                'text' => trim($matches[2])
            ];
        }
    }

    return $options;
}

function parseModernQuestionBlock($block, $index)
{
    $field = function ($name) use ($block) {
        if (preg_match('/^' . preg_quote($name, '/') . '[：:]\s*(.+)$/mu', $block, $matches)) {
            return trim($matches[1]);
        }

        return '';
    };

    $optionsText = '';
    if (preg_match('/选项[：:]\s*\n(.*?)(?=\n(?:答案|解析|题型|难度|标签|题目)[：:]|$)/su', $block, $matches)) {
        $optionsText = $matches[1];
    }

    $type = $field('题型') ?: 'single';
    $question = $field('题目');

    return [
        'id' => 'q' . $index,
        'number' => $index,
        'type' => $type,
        'difficulty' => $field('难度') ?: 'normal',
        'tags' => array_values(array_filter(array_map('trim', preg_split('/[,，]/u', $field('标签'))))),
        'question' => $question,
        'options' => parseOptionLines($optionsText),
        'answer' => normalizeAnswer($field('答案')),
        'analysis' => $field('解析')
    ];
}

function parseLegacyQuestions($body)
{
    $questions = [];
    preg_match_all('/# 问题\d+\s*\n(.*?)(?=\n#\s*问题\d+|$)/su', $body, $matches);

    foreach ($matches[1] as $index => $questionContent) {
        $questionText = '';
        $options = [];

        foreach (explode("\n", trim($questionContent)) as $line) {
            $line = trim($line);
            if ($line === '') {
                continue;
            }

            if (preg_match('/^-\s*([A-Z])[\.\、]\s*(.+)$/u', $line, $option)) {
                $options[] = [
                    'key' => strtoupper($option[1]),
                    'text' => trim($option[2])
                ];
                continue;
            }

            $questionText = $line;
        }

        if ($questionText !== '' && count($options) > 0) {
            $questions[] = [
                'id' => 'q' . ($index + 1),
                'number' => $index + 1,
                'type' => 'single',
                'difficulty' => 'normal',
                'tags' => [],
                'question' => $questionText,
                'options' => $options,
                'answer' => [],
                'analysis' => ''
            ];
        }
    }

    return $questions;
}

function parseModernQuestions($body)
{
    $questions = [];
    preg_match_all('/###\s*Q(\d+)\s*\n(.*?)(?=\n###\s*Q\d+|$)/su', $body, $matches, PREG_SET_ORDER);

    foreach ($matches as $match) {
        $questions[] = parseModernQuestionBlock($match[2], (int) $match[1]);
    }

    return $questions;
}

function parseMarkdownExamFile($filepath)
{
    if (!is_file($filepath)) {
        return null;
    }

    $content = str_replace(["\r\n", "\r"], "\n", file_get_contents($filepath));
    [$metadata, $body] = parseFrontMatter($content);

    $questions = parseModernQuestions($body);
    if (count($questions) === 0) {
        $questions = parseLegacyQuestions($body);
    }

    return [
        'metadata' => $metadata,
        'questions' => $questions
    ];
}

function getExamDirectory()
{
    return __DIR__ . '/exam';
}

function normalizeExamId($id)
{
    $id = trim(str_replace('\\', '/', $id), '/');

    if ($id === '' || preg_match('/(^|\/)\.\.?(\/|$)/', $id)) {
        return null;
    }

    $segments = explode('/', $id);
    if (count($segments) > 3) {
        return null;
    }

    foreach ($segments as $segment) {
        if (!preg_match('/^[a-zA-Z0-9_-]+$/', $segment)) {
            return null;
        }
    }

    return implode('/', $segments);
}

function examIdFromPath($file)
{
    $base = realpath(getExamDirectory());
    $path = realpath($file);

    if ($base === false || $path === false || strpos($path, $base . DIRECTORY_SEPARATOR) !== 0) {
        return null;
    }

    $relative = substr($path, strlen($base) + 1);
    if (substr($relative, -3) !== '.md') {
        return null;
    }

    return str_replace(DIRECTORY_SEPARATOR, '/', substr($relative, 0, -3));
}

function getExamPathById($id)
{
    $id = normalizeExamId($id);
    if ($id === null) {
        return null;
    }

    $base = realpath(getExamDirectory());
    $path = realpath(getExamDirectory() . '/' . $id . '.md');

    if ($base === false || $path === false || strpos($path, $base . DIRECTORY_SEPARATOR) !== 0) {
        return null;
    }

    return $path;
}

function buildExamSummary($id, $data)
{
    $metadata = $data['metadata'];
    $segments = explode('/', $id);
    $depth = count($segments);

    return [
        'id' => $id,
        'title' => $metadata['title'] ?? $id,
        'description' => $metadata['description'] ?? '',
        'category' => $metadata['category'] ?? '',
        'group' => $metadata['group'] ?? ($segments[0] ?? ''),
        'series' => $metadata['series'] ?? ($depth > 1 ? $segments[$depth - 2] : ''),
        'path' => $segments,
        'tags' => $metadata['tags'] ?? [],
        'icon' => $metadata['icon'] ?? '📝',
        'difficulty' => $metadata['difficulty'] ?? '中等',
        'duration' => $metadata['duration'] ?? '未知',
        'questionCount' => count($data['questions'])
    ];
}

function listExamSummaries($keyword = '')
{
    $exams = [];
    $files = [];
    $base = getExamDirectory();
    $keywordLower = mb_strtolower(trim($keyword), 'UTF-8');

    if (!is_dir($base)) {
        return [];
    }

    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($base, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::LEAVES_ONLY
    );

    foreach ($iterator as $fileInfo) {
        if (!$fileInfo->isFile() || strtolower($fileInfo->getExtension()) !== 'md') {
            continue;
        }

        $id = examIdFromPath($fileInfo->getPathname());
        if ($id === null || normalizeExamId($id) === null) {
            continue;
        }

        $files[$id] = $fileInfo->getPathname();
    }

    ksort($files, SORT_NATURAL);

    foreach ($files as $file) {
        $data = parseMarkdownExamFile($file);
        if (!$data) {
            continue;
        }

        $id = examIdFromPath($file);
        if ($id === null) {
            continue;
        }

        $summary = buildExamSummary($id, $data);
        $haystack = mb_strtolower($summary['id'] . ' ' . $summary['title'] . ' ' . $summary['description'] . ' ' . $summary['group'] . ' ' . $summary['series'] . ' ' . implode(' ', $summary['tags']), 'UTF-8');

        if ($keywordLower === '' || mb_strpos($haystack, $keywordLower, 0, 'UTF-8') !== false) {
            $exams[] = $summary;
        }
    }

    return $exams;
}
