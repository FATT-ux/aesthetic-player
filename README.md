# 🎧 Атмосферный плеер

**Эстетичный веб-плеер с 3D-перспективой, динамической подсветкой под цвет обложки и синхронизированным караоке-текстом.**

<p align="center">
  <img height="32" alt="React" src="https://github.com/user-attachments/assets/eb54dbc6-7d00-4a6d-888b-b1eda522309b" />
  &nbsp;&nbsp;&nbsp;
  <img height="32" alt="TypeScript" src="https://github.com/user-attachments/assets/8cdf1f8c-54b4-448e-ad16-bdec6501fdc2" />
  &nbsp;&nbsp;&nbsp;
  <img height="32" alt="Vite" src="https://github.com/user-attachments/assets/b5917c67-31dd-4939-9735-f00f65781c74" />
  &nbsp;&nbsp;&nbsp;
  <img height="32" alt="Node.js" src="https://github.com/user-attachments/assets/03da293c-8d5c-48f7-9602-accdf1e90d83" />
  &nbsp;&nbsp;&nbsp;
  <img height="32" alt="Google Gemini" src="https://github.com/user-attachments/assets/6007b85c-9c5f-4d17-a9b3-80e414e05fe4" />
</p>

</div>

---

## ✨ Возможности

- **3D-сцена с перспективой** — объёмная композиция из очереди треков слева, центральной обложки и динамического текста справа.
- **Адаптивная неоновая подсветка** — автоматическое извлечение доминирующего цвета обложки (`fast-average-color`) и плавное окрашивание контура экрана и активных элементов.
- **Караоке-текст (LRC Lyrics)** — подсветка текущей строчки в реальном времени, эффект глубины резкости для соседних строк и перемотка трека по клику на любую строку.
- **Живой поиск (Popover)** — выезжающее над нижней панелью окно с мгновенным поиском, горизонтальными лентами треков и артистов и клиентским кэшем.
- **Автономный бэкенд** — при первом запуске сервер сам скачивает актуальный бинарник `yt-dlp` под вашу ОС (macOS / Windows / Linux).
- **Умное управление** — сохранение очереди (`Continue Playing`) и громкости в `localStorage`, предзагрузка следующего трека и горячие клавиши.

---

## 📁 Структура проекта

```text
aesthetic-player/
├── backend/
│   └── src/
│       └── index.ts          # Express API: поиск, стриминг, обложки и тексты
└── frontend/
    └── src/
        ├── components/       # UI-компоненты (QueueSidebar, CenterTrackCard, LyricsViewer, PlayerBar, SearchModal)
        ├── styles/           # Модульные CSS-стили для каждого компонента
        ├── types/            # TypeScript-интерфейсы треков и текстов
        ├── utils/            # Парсер LRC-таймкодов, экстрактор цвета и форматирование времени
        └── App.tsx           # Главная логика плеера и горячие клавиши
```

---

## 🚀 Быстрый старт

### 1. Клонирование репозитория
```bash
git clone https://github.com
cd aesthetic-player
```

### 2. Запуск Backend (`http://localhost:3001`)
```bash
cd backend
npm install
npm run dev
```

### 3. Запуск Frontend (`http://localhost:5173`)
Откройте вторую вкладку терминала:
```bash
cd frontend
npm install
npm run dev
```

Откройте **`http://localhost:5173`** в браузере.

---

## ⌨️ Горячие клавиши

| Клавиша | Действие |
| :--- | :--- |
| **`Cmd + K`** / **`Ctrl + K`** | Открыть или закрыть окно поиска |
| **`Space`** | Пауза / Воспроизведение |
| **`←`** / **`→`** | Перемотка на 5 секунд назад / вперёд |
| **`Esc`** | Закрыть окно поиска |

---

## ⚠️ Проблемы проекта

- **Региональные ограничения API:** из-за блокировок популярных зарубежных музыкальных сервисов в РФ (Apple iTunes, Deezer, Spotify, Audius) поиск метаданных и текстов реализован через открытую базу **LRCLIB**, а стриминг аудио и обложек — через **SoundCloud (`yt-dlp`)**.
- **Скорость старта трека:** при первом запуске новой песни утилите `yt-dlp` требуется много времени на поиск и извлечение прямой аудио-ссылки без DRM-защиты (повторные запуски срабатывают мгновенно из кэша).

---

## 📸 Скриншоты

<div align="center">
  <img src="https://github.com/user-attachments/assets/d86c7d95-6f21-4d8f-a3cf-1707ef4875d1" alt="Главный экран плеера" width="100%" />
  <br />
  <sub><b>Главный экран: 3D-перспектива, адаптивная подсветка и караоке-текст</b></sub>
</div>

<br />

<table>
  <tr>
    <td align="center" width="50%">
      <img src="https://github.com/user-attachments/assets/0c35ce23-3cff-4ff5-aedd-33698ecfdc7c" alt="Интерфейс плеера" width="100%" />
      <br />
      <sub><b>Выезжающий поиск треков и артистов</b></sub>
    </td>
    <td align="center" width="50%">
      <img src="https://github.com/user-attachments/assets/0d6cf3c7-eebb-4d9b-b638-11a567a2adf1" alt="Живой поиск" width="100%" />
      <br />
      <sub><b>Очередь треков и динамический фокус</b></sub>
    </td>
  </tr>
</table>



