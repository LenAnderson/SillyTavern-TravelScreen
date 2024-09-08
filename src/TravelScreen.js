import { SlashCommandClosure } from '../../../../slash-commands/SlashCommandClosure.js';
import { delay } from '../../../../utils.js';
import { waitForFrame } from '../lib/wait.js';


/** @enum {string?} */
export const LOADING_SCREEN_SIZE = {
    FULL: 'full',
    INSET: 'inset',
};


export class TravelScreen {
    /**@type {LOADING_SCREEN_SIZE} */ size = LOADING_SCREEN_SIZE.FULL;
    /**@type {number} */ blur = 6;
    /**@type {string} */ backgroundColor;
    /**@type {string} */ backgroundImage;
    /**@type {string[]} */ classList = [];
    /**@type {string} */ mapImage;
    /**@type {number} */ zoom = 1.0;
    /**@type {number} */ speed = 1.0;
    /**@type {{x:number, y:number, dist:number, totalDist:number}[]} */ pointList = [];
    /**@type {number} */ lineWidth = 10;
    /**@type {string} */ lineColor = 'red';
    /**@type {number} */ lineShadowSize = 4;
    /**@type {string} */ lineShadowColor = 'rgb(0 0 0 / 0.5)';
    /**@type {number} */ pointSize = 20;
    /**@type {string} */ pointColor = 'red';
    /**@type {number} */ pointShadowSize = 6;
    /**@type {string} */ pointShadowColor = 'black';
    /**@type {number} */ waitBefore = 1000;
    /**@type {number} */ waitAfter = 1000;
    /**@type {number} */ transitionTime = 400;
    /**@type {string} */ sfxUrl;
    /**@type {number} */ sfxVolume = 0.25;
    /**@type {number} */ sfxOffset = 0;
    /**@type {number} */ sfxFadeIn = 1000;
    /**@type {number} */ sfxFadeOut = 1000;
    /**@type {number} */ fps = 60;

    /**@type {SlashCommandClosure} */ before;
    /**@type {SlashCommandClosure} */ after;


    // state
    /**@type {boolean} */ isActive = false;
    /**@type {Promise<string>} */ promise;
    /**@type {(result:string)=>void} */ resolve;
    /**@type {AudioBufferSourceNode} */ sfx;

    /**@type {number} */ width;
    /**@type {number} */ height;

    /**@type {CanvasRenderingContext2D} */ context;


    // DOM
    dom = {
        /**@type {HTMLDialogElement} */
        root: undefined,
        /**@type {HTMLElement} */
        bgImg: undefined,
        /**@type {HTMLElement} */
        page: undefined,
        /**@type {HTMLElement} */
        layers: undefined,
    };




    async start() {
        this.isActive = true;
        this.promise = new Promise(resolve=>this.resolve = resolve);
        const dom = await this.render();
        if (this.before) {
            await this.before.execute();
        }
        await this.animate();
        // await this.next();
        // const result = await this.promise;
        this.isActive = false;
        this.dom.root.classList.remove('stls--showBackdrop');
        this.dom.bgImg?.classList?.remove('stls--showBackdrop');
        this.dom.root.classList.remove('stls--show');
        await delay(this.transitionTime + 10);
        dom.close();
        Object.keys(this.dom).forEach(key=>this.dom[key]?.remove?.());
        this.dom.root = null;
        if (this.after) {
            const afterResult = await this.after.execute();
            return afterResult?.pipe;
        }
        // return result;
    }

    async stop(result = null) {
        this.resolve(result ?? '');
    }


    addDistance() {
        let prev;
        const a = this.width / this.height;
        for (const p of this.pointList) {
            if (!prev) {
                p.dist = 0;
                prev = p;
                continue;
            }
            p.dist = Math.sqrt(Math.pow(prev.x * a - p.x * a, 2) + Math.pow(prev.y - p.y, 2));
            p.totalDist = prev.totalDist + p.dist;
            prev = p;
        }
    }


    async render() {
        if (!this.dom.root) {
            /**@type {Promise} */
            let promprom;
            /**@type {Promise} */
            let bgProm;
            if (this.size != LOADING_SCREEN_SIZE.FULL && this.backgroundImage) {
                const bg = document.createElement('dialog'); {
                    this.dom.bgImg = bg;
                    bg.classList.add('stls--bg');
                    bg.style.backgroundImage = `url("${this.backgroundImage}")`;
                    bg.style.setProperty('--transition', this.transitionTime.toString());
                    const img = new Image();
                    img.src = this.backgroundImage;
                    const { promise, resolve } = Promise.withResolvers();
                    bgProm = promise;
                    if (img.complete) resolve();
                    img.addEventListener('load', resolve);
                    img.addEventListener('error', resolve);
                    document.body.append(bg);
                    bg.showModal();
                }
            }
            const root = document.createElement('dialog'); {
                this.dom.root = root;
                root.classList.add('stls--root');
                root.dataset.stwizSize = this.size;
                root.style.setProperty('--transition', this.transitionTime.toString());
                for (const c of this.classList) root.classList.add(c);
                if (this.size != LOADING_SCREEN_SIZE.FULL) {
                    if (this.backgroundColor) root.style.backgroundColor = this.backgroundColor;
                    root.style.setProperty('--blur', this.blur.toString());
                }
                const layers = document.createElement('div'); {
                    this.dom.layers = layers;
                    layers.classList.add('stls--layers');
                    if (this.size == LOADING_SCREEN_SIZE.INSET) {
                        layers.style.width = `${this.zoom * 100}%`;
                        layers.style.height = `${this.zoom * 100}%`;
                    } else {
                        layers.style.maxWidth = `${this.zoom * 100}%`;
                        layers.style.maxHeight = `${this.zoom * 100}%`;
                    }
                    const bg = document.createElement('img'); {
                        bg.classList.add('stls--layer');
                        bg.classList.add('stls--background');
                        bg.src = this.mapImage;
                    }
                    const prom = new Promise(resolve=>{
                        if (bg.complete) return resolve();
                        bg.addEventListener('load', resolve);
                        bg.addEventListener('error', resolve);
                    });
                    promprom = prom.then(async()=>{
                        this.width = bg.naturalWidth;
                        this.height = bg.naturalHeight;
                        const a = this.width / this.height;
                        const aw = window.innerWidth * (this.size == LOADING_SCREEN_SIZE.INSET ? 0.6 : 1.0);
                        const ah = window.innerHeight * (this.size == LOADING_SCREEN_SIZE.INSET ? 0.8 : 1.0);
                        const aa = aw / ah;
                        if (this.size == LOADING_SCREEN_SIZE.INSET) {
                            let ow;
                            let oh;
                            if (a > aa) {
                                // map is wider
                                this.pxWidth = aw * this.zoom;
                                this.pxHeight = aw / this.width * this.height * this.zoom;
                                ow = aw;
                                oh = aw / this.width * this.height;
                            } else {
                                // map is taller
                                this.pxHeight = ah * this.zoom;
                                this.pxWidth = ah / this.height * this.width * this.zoom;
                                oh = ah;
                                ow = ah / this.height * this.width;
                            }
                            this.dom.root.style.aspectRatio = `${this.width} / ${this.height}`;
                            { // initial map offset
                                const pos = {
                                    x: this.pointList[0].x / 100 * this.pxWidth,
                                    y: this.pointList[0].y / 100 * this.pxHeight,
                                };
                                const dw = this.pxWidth - ow;
                                const dh = this.pxHeight - oh;
                                if (dw < 0) {
                                    this.dom.layers.style.left = `${-dw / 2}px`;
                                    this.dom.layers.classList.add('stls--inset');
                                } else {
                                    this.dom.layers.style.left = `${Math.min(0, Math.max(-dw, ow / 2 - pos.x))}px`;
                                }
                                if (dh < 0) {
                                    this.dom.layers.style.top = `${-dh / 2}px`;
                                    this.dom.layers.classList.add('stls--inset');
                                } else {
                                    this.dom.layers.style.top = `${Math.min(0, Math.max(-dh, oh / 2 - pos.y))}px`;
                                }
                            }
                        } else {
                            if (a > aa) {
                                // map is wider
                                this.pxWidth = aw * this.zoom;
                                this.pxHeight = aw / this.width * this.height * this.zoom;
                                layers.style.width = `${100 * this.zoom}%`;
                            } else {
                                // map is taller
                                this.pxHeight = ah * this.zoom;
                                this.pxWidth = ah / this.height * this.width * this.zoom;
                                layers.style.height = `${100 * this.zoom}%`;
                            }
                            this.dom.root.style.aspectRatio = `${aw} / ${ah}`;
                            layers.style.aspectRatio = `${this.width} / ${this.height}`;
                            { // initial map offset
                                const pos = {
                                    x: this.pointList[0].x / 100 * this.pxWidth,
                                    y: this.pointList[0].y / 100 * this.pxHeight,
                                };
                                const ow = window.innerWidth;
                                const oh = window.innerHeight;
                                const dw = this.pxWidth - ow;
                                const dh = this.pxHeight - oh;
                                if (dw < 0) {
                                    this.dom.layers.style.left = `${-dw / 2}px`;
                                    this.dom.layers.classList.add('stls--inset');
                                } else {
                                    this.dom.layers.style.left = `${Math.min(0, Math.max(-dw, ow / 2 - pos.x))}px`;
                                }
                                if (dh < 0) {
                                    this.dom.layers.style.top = `${-dh / 2}px`;
                                    this.dom.layers.classList.add('stls--inset');
                                } else {
                                    this.dom.layers.style.top = `${Math.min(0, Math.max(-dh, oh / 2 - pos.y))}px`;
                                }
                            }
                        }
                        layers.append(bg);
                        const canvas = document.createElement('canvas'); {
                            canvas.classList.add('stls--layer');
                            canvas.classList.add('stls--canvas');
                            canvas.width = this.pxWidth;
                            canvas.height = this.pxHeight;
                            this.context = canvas.getContext('2d');
                            layers.append(canvas);
                        }
                        this.addDistance();
                        if (this.sfxUrl) {
                            try {
                                const response = await fetch(this.sfxUrl, { headers: { responseType: 'arraybuffer' } });
                                if (!response.ok) {
                                    console.error('[INDY]', `${response.status} - ${response.statusText}: /sfx ${this.sfxUrl}`);
                                }
                                const con = new AudioContext();
                                this.sfxContext = con;
                                await con.suspend();
                                const src = con.createBufferSource();
                                this.sfx = src;
                                src.buffer = await con.decodeAudioData(await response.arrayBuffer());
                                const volume = con.createGain();
                                if (this.sfxFadeIn) {
                                    volume.gain.value = 0.01;
                                    volume.gain.exponentialRampToValueAtTime(Math.max(0.01, this.sfxVolume), con.currentTime + this.sfxFadeIn / 1000);
                                }
                                if (this.sfxFadeOut) {
                                    const totalTime = (this.pointList.at(-1).totalDist / (this.speed * 0.5) * 30 + this.waitBefore + this.waitAfter) / 1000;
                                    volume.gain.setValueAtTime(this.sfxVolume, con.currentTime + totalTime - this.sfxFadeOut / 1000);
                                    volume.gain.exponentialRampToValueAtTime(0.01, con.currentTime + totalTime);
                                }
                                volume.connect(con.destination);
                                src.connect(volume);
                            } catch (ex) {
                                console.error('[INDY]', ex);
                            }
                        }
                        await waitForFrame();
                        root.classList.add('stls--show');
                        await delay(this.transitionTime + 10);
                    });
                    root.append(layers);
                }
                root.addEventListener('keydown', (evt)=>{
                    if (evt.key == 'Escape') {
                        evt.preventDefault();
                        evt.stopPropagation();
                        // this.stop();
                    }
                });
                document.body.append(root);
                root.showModal();
                await (bgProm ?? Promise.resolve());
                await waitForFrame();
                this.dom.bgImg?.classList.add('stls--showBackdrop');
                root.classList.add('stls--showBackdrop');
                await delay(this.transitionTime + 10);
                await promprom;
            }
        }
        return this.dom.root;
    }

    async animate() {
        const speed = this.speed * 0.5;
        // const destList = [
        //     { x:20, y:80 },
        //     { x:40, y:45 },
        //     { x:60, y:55 },
        //     { x:75, y:10 },
        // ];
        /**@type {number} */
        let totalDistMade = 0;
        const fpsTime = 1000 / this.fps;
        let lastFrame = 0;
        const { promise, resolve } = Promise.withResolvers();
        const animateFrame = ()=>{
            const now = performance.now();
            if (now - lastFrame < fpsTime) return requestAnimationFrame(animateFrame);
            const delta = lastFrame == 0 ? 0 : now - lastFrame;
            lastFrame = now;
            totalDistMade += speed * delta / 30;
            this.drawFrame(totalDistMade);
            if (totalDistMade > this.pointList.at(-1).totalDist) {
                resolve();
                return;
            }
            return requestAnimationFrame(animateFrame);
        };
        if (this.sfx) {
            await this.sfxContext.resume();
            this.sfx.start(0, this.sfxOffset / 1000);
        }
        await delay(this.waitBefore);
        requestAnimationFrame(animateFrame);
        await promise;
        await delay(this.waitAfter);
        if (this.sfx) {
            this.sfx.stop();
            this.sfxContext.close();
        }
    }

    drawFrame(totalDistMade) {
        const con = this.context;
        const w = this.pxWidth;
        const h = this.pxHeight;
        con.clearRect(0, 0, w, h);
        con.fillStyle = this.pointColor;
        con.strokeStyle = this.lineColor;
        con.lineWidth = this.lineWidth;
        con.shadowBlur = this.lineShadowSize;
        con.shadowColor = this.lineShadowColor;
        con.lineCap = 'round';
        let pp;
        let line;
        let dist;
        let distMade;
        for (const p of this.pointList) {
            if (p.totalDist > totalDistMade) {
                line = { a:pp, b:p };
                distMade = totalDistMade - line.a.totalDist;
                dist = line.b.dist;
                break;
            }
            if (pp) {
                con.beginPath();
                con.moveTo(pp.x / 100 * w, pp.y / 100 * h);
                con.lineTo(p.x / 100 * w, p.y / 100 * h);
                con.closePath();
                con.stroke();
            }
            pp = p;
        }
        if (line) {
            const pos = {
                x: (line.a.x + (line.b.x - line.a.x) * Math.min(1.0, distMade / dist)) / 100 * w,
                y: (line.a.y + (line.b.y - line.a.y) * Math.min(1.0, distMade / dist)) / 100 * h,
            };
            const ow = this.dom.root.offsetWidth;
            const oh = this.dom.root.offsetHeight;
            const dw = w - ow;
            const dh = h - oh;
            if (dw < 0) {
                this.dom.layers.style.left = `${-dw / 2}px`;
            } else {
                this.dom.layers.style.left = `${Math.min(0, Math.max(-dw, ow / 2 - pos.x))}px`;
            }
            if (dh < 0) {
                this.dom.layers.style.top = `${-dh / 2}px`;
            } else {
                this.dom.layers.style.top = `${Math.min(0, Math.max(-dh, oh / 2 - pos.y))}px`;
            }
            con.beginPath();
            con.moveTo(line.a.x / 100 * w, line.a.y / 100 * h);
            con.lineTo(pos.x, pos.y);
            con.closePath();
            con.stroke();
        }
        con.shadowBlur = this.pointShadowSize;
        con.shadowColor = this.pointShadowColor;
        let radius = this.pointSize / 2;
        for (const p of this.pointList) {
            if (pp?.totalDist > totalDistMade) break;
            con.beginPath();
            con.ellipse(
                (p.x / 100 * w),
                (p.y / 100 * h),
                Math.abs(radius),
                Math.abs(radius),
                0,
                0,
                2 * Math.PI,
            );
            con.closePath();
            con.fill();
            pp = p;
        }
    }
}
