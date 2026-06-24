# MIND-BATTERY Google Drive Upload

Apps Script Web App으로 검사 결과 텍스트를 Google Drive 폴더에 저장한다.

## 설정

1. Google Drive에서 결과 저장용 폴더를 만든다.
2. 폴더 URL에서 폴더 ID를 복사한다.
3. Google Apps Script 프로젝트를 만든다.
4. `Code.gs` 내용을 Apps Script 편집기에 붙여넣는다.
5. Apps Script `Project Settings` > `Script Properties`에 아래 값을 추가한다.

| Name | Value |
| --- | --- |
| `MIND_BATTERY_FOLDER_ID` | 결과 파일을 저장할 Drive 폴더 ID |
| `MIND_BATTERY_SHARED_SECRET` | 임의의 긴 문자열. 비워두면 검증하지 않음 |

6. `Deploy` > `New deployment` > `Web app`으로 배포한다.
7. `Execute as`는 `Me`, `Who has access`는 앱 사용 범위에 맞게 선택한다.
8. 배포된 Web App URL을 `index.html`의 `mind-battery-upload-url`에 넣는다.
9. `MIND_BATTERY_SHARED_SECRET`을 설정했다면 같은 값을 `mind-battery-upload-secret`에 넣는다.

```html
<meta name="mind-battery-upload-url" content="https://script.google.com/macros/s/.../exec">
<meta name="mind-battery-upload-secret" content="shared-secret-value">
```

## 주의

프론트엔드에 넣는 secret은 사용자가 소스 보기로 확인할 수 있다. 공개 배포 환경에서 강한 접근 제어가 필요하면 Cloudflare Worker, Firebase Functions, 자체 API 서버 같은 서버 측 프록시를 둬야 한다.
