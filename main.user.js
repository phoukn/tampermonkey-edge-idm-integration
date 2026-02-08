// ==UserScript==
// @name         安卓Edge下载器-默认调用1DM+
// @namespace    https://github.com/phoukn/tampermonkey-edge-idm-integration/tree/main
// @version      1.4.1
// @description  通过检测链接关键字调用第三方下载器（仅适用于1DM+），仅限安卓Edge（Chromium），Firefox默认禁用
// @author       Gemini 3 PRO & Qwen3-Coder
// @contributor  https://github.com/JulianRyder01
// @match        *://*/*
// @grant        none
// @run-at       document-start
// @downloadURL  https://raw.githubusercontent.com/phoukn/tampermonkey-edge-idm-integration/main/main.user.js
// @updateURL    https://raw.githubusercontent.com/phoukn/tampermonkey-edge-idm-integration/main/main.user.js
// ==/UserScript==

(function() {
    'use strict';

    // ================= 0. 浏览器检测 =================
    const ua = navigator.userAgent;
    if (ua.includes('Firefox') || ua.includes('FxiOS')) {
        console.log('🚫 [IDM+ Script] 检测到 Firefox，脚本已自动禁用。');
        return;
    }
    console.log('✅ [IDM+ Script] 检测到 Chromium/Edge，脚本启动。');

    // ================= 1. 配置区域 =================
    const IDM_PACKAGE = 'idm.internet.download.manager.plus';

    const EXTENSIONS = [
        // === Android 安装包 ===
        '.apk', '.apks', '.xapk', '.apkm', '.ipa', '.obb', '.aab',
        // === 压缩文件 ===
        '.zip', '.rar', '.7z', '.tar', '.gz', '.tgz', '.bz2', '.xz',
        '.iso', '.cab', '.jar', '.z',
        // === 视频媒体 ===
        '.mp4', '.mkv', '.avi', '.mov', '.flv', '.wmv', '.webm',
        '.m4v', '.3gp', '.ts', '.mpg', '.mpeg', '.vob',
        // === 音频媒体 ===
        '.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac', '.wma', '.ape',
        // === 文档/电子书 ===
        '.pdf', '.epub', '.mobi', '.azw3', '.djvu',
        '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        // === 可执行/系统文件 ===
        '.exe', '.msi', '.bin', '.dat', '.dmg', '.bat', '.sh', '.img',
        // === 种子/磁力 ===
        '.torrent'
        // === 图片（默认关闭）===
        // '.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg', '.tiff'
    ];

    /**
     * [广谱关键字库 - 精准上下文匹配]
     * 仅匹配具有明确下载语义的路径或参数
     */
    const KEYWORDS = [
        // 路径类
        '/down/', '/download/', '/downloads/', '/dl/', '/get/', '/fetch/',
        '/files/', '/file/', '/attach/', '/attachment/', '/media/', '/static/',
        '/assets/', '/cdn/', '/dist/', '/repo/', '/backup/', '/upload/',
        '/releases/download/', '/binary/', '/pkg/',

        // 查询参数类（带 ? 或 &）
        '?file=', '&file=', '?filename=', '&filename=', '?f=', '&f=',
        'download?', '&download=', '?download=', '&download=',
        'token=', 'auth_key=', 'download_token=', 'sig=', 'signature=',
        'force_download', 'response-content-disposition=',
        'content-disposition=attachment'
    ];

    // ================= 2. 核心逻辑 =================
    function isDownloadLink(url) {
        if (!url || !url.startsWith('http')) return false;
        const lowerUrl = url.toLowerCase();

        // 排除非下载页面（仅保留账户相关）
        if (
            lowerUrl.includes('/login') ||
            lowerUrl.includes('/register') ||
            lowerUrl.includes('/signin') ||
            lowerUrl.includes('/signup') ||
            lowerUrl.includes('/logout') ||
            lowerUrl.includes('/account/') ||
            lowerUrl.includes('/user/')
        ) {
            return false;
        }

        // --- 策略 1: 后缀匹配 ---
        try {
            const cleanPath = new URL(url).pathname.toLowerCase();
            if (EXTENSIONS.some(ext => cleanPath.endsWith(ext))) {
                return true;
            }
        } catch (e) {
            const simplePath = lowerUrl.split('?')[0].split('#')[0];
            if (EXTENSIONS.some(ext => simplePath.endsWith(ext))) {
                return true;
            }
        }

        // --- 策略 2: 关键字匹配 ---
        for (const kw of KEYWORDS) {
            if (lowerUrl.includes(kw)) {
                return true;
            }
        }

        return false; // 无策略 3（暴力检查已移除）
    }

    function openIntent(url) {
        const scheme = url.startsWith('https') ? 'https' : 'http';
        const cleanLink = url.replace(/^https?:\/\//, '');
        const intentUrl = `intent://${cleanLink}#Intent;scheme=${scheme};package=${IDM_PACKAGE};type=*/*;end`;
        window.location.href = intentUrl;
    }

    // 全局点击监听（捕获阶段）
    document.addEventListener('click', function(e) {
        let target = e.target;
        while (target && target.tagName !== 'A') {
            target = target.parentElement;
            if (!target) return;
        }

        const url = target.href;
        if (isDownloadLink(url)) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            // 用户提示
            try {
                const toast = document.createElement('div');
                toast.innerHTML = '⚡ <b>1DM+</b> 正在唤起...';
                toast.style.cssText = `
                    position: fixed;
                    bottom: 15%;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0, 0, 0, 0.85);
                    color: #fff;
                    padding: 8px 16px;
                    border-radius: 6px;
                    z-index: 999999;
                    font-size: 13px;
                    pointer-events: none;
                `;
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 1500);
            } catch (err) {
                // 忽略 DOM 错误
            }

            openIntent(url);
        }
    }, true);
})();
