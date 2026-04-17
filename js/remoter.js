"use strict";

// LiveSplit Websocket 遠端控制器類別
class LSRemoter {
    #ws;
    #connected = false;
    #latencyHistory = [];
    #averageLatency = 0;
    #pingStart;
    #url;
    #maxHistory = 10;
    #latencyElem = document.getElementById("latency");

    constructor(url) {
        this.#url = url;
        this.#initConnection();

        // 自動重連
        setInterval(() => {
            this.#reconnect();
        }, 5000);

        // 自動發送 ping
        setInterval(() => {
            if (this.#ws.readyState === WebSocket.OPEN) {
                this.#pingStart = performance.now();
                this.#ws.send("ping");
            }
        }, 500);
    }

    // 初始連線、綁定事件
    #initConnection() {
        this.#ws = new WebSocket(this.#url);

        this.#latencyElem.textContent = "正在連線...";
        this.#latencyElem.className = "green";

        this.#ws.addEventListener("open", () => {
            this.#connected = true;
            console.log(`[open] 連線到 ${this.#url} 成功`);
            this.#enableButton();
        });

        this.#ws.addEventListener("error", (err) => {
            this.#connected = false;
            console.log(`[error] 連線失敗，請檢查 LiveSplit 是否啟動 Websocket Server`);
            this.#latencyElem.textContent = "連線失敗，請檢查 LiveSplit 是否啟動 Websocket Server";
            this.#latencyElem.className = "red";
            this.#disableButton();
        });

        this.#ws.addEventListener("close", () => {
        });

        this.#ws.addEventListener("message", () => {
            const latencyNow = performance.now() - this.#pingStart;
            this.#latencyHistory.push(latencyNow);
            if (this.#latencyHistory.length > this.#maxHistory) {
                this.#latencyHistory.shift();
            }
            this.#averageLatency = this.#latencyHistory.reduce((a, b) => a + b, 0) / this.#latencyHistory.length;
            this.#latencyElem.textContent = `${this.#averageLatency.toFixed(2)} ms，（${(this.#averageLatency / 1000).toFixed(3)} 秒）`;
            this.#latencyElem.className = "";
        });
    }

    // 重新連線
    #reconnect() {
        if (this.#ws.readyState === WebSocket.CLOSED) {
            /*
            console.log(`正在嘗試重新連線...`);
            this.#initConnection();*/
        }
    }

    // 啟動按鈕
    #enableButton() {
        document.getElementById("startTimer").disabled = false;
        document.getElementById("resetTimer").disabled = false;
    }

    // 關閉按鈕
    #disableButton() {
        document.getElementById("startTimer").disabled = true;
        document.getElementById("resetTimer").disabled = true;
    }

    // 變更連線網址，重新連線
    changeURL(newURL) {
        if (this.#ws.readyState === WebSocket.OPEN) {
            this.#ws.close();
        }
        this.#url = newURL;
        this.#initConnection();
    }

    // 開始計時
    startTimer() {
        if (this.#connected) {
            this.#ws.send("start");
        } else {
            console.log("尚未連線，無法發送指令");
        }
    }

    // 重設計時
    resetTimer() {
        if (this.#connected) {
            this.#ws.send("reset");
        } else {
            console.log("尚未連線，無法發送指令");
        }
    }
}

// 初始化物件
let remoter = new LSRemoter(`ws://${document.getElementById("ip").value}:16834/livesplit`);
