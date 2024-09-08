import { delay } from '../../../../utils.js';
import { waitForFrame } from '../lib/wait.js';
import { TravelScreen } from './TravelScreen.js';

export class TravelHelper {
    /**@type {string} */ mapImage;
    /**@type {{x:number, y:number, dist:number, totalDist:number}[]} */ pointList = [];
    /**@type {import('../../../../slash-commands/SlashCommand.js').NamedArguments} */ args;


    // state
    /**@type {number} */ width;
    /**@type {number} */ height;

    /**@type {CanvasRenderingContext2D} */ context;
    /**@type {TravelScreen} */ travelScreen;


    // DOM
    dom = {
        /**@type {HTMLDialogElement} */
        root: undefined,
        /**@type {HTMLElement} */
        bgImg: undefined,
        /**@type {HTMLElement} */
        layers: undefined,
        /**@type {HTMLCanvasElement} */
        canvas: undefined,
        /**@type {HTMLInputElement} */
        time: undefined,
        /**@type {HTMLOptionElement} */
        timeMid: undefined,
        /**@type {HTMLOptionElement} */
        timeEnd: undefined,
        /**@type {HTMLElement} */
        cmd: undefined,
    };




    async render() {
        if (!this.dom.root) {
            this.travelScreen = new TravelScreen();
            this.travelScreen.pointList = this.pointList;
            const root = document.createElement('dialog'); {
                this.dom.root = root;
                root.classList.add('stls--helper');
                root.addEventListener('keydown', (evt)=>{
                    if (evt.key == 'Escape') {
                        evt.preventDefault();
                        evt.stopPropagation();
                        this.dom.root.close();
                        Object.keys(this.dom).forEach(key=>this.dom[key]?.remove?.());
                        this.dom.root = null;
                    }
                });
                const help = document.createElement('small'); {
                    help.classList.add('stls--help');
                    help.textContent = 'Click and drag to add / move points. Right-click to remove points.';
                    root.append(help);
                }
                const layers = document.createElement('div'); {
                    this.dom.layers = layers;
                    this.travelScreen.dom.root = layers;
                    this.travelScreen.dom.layers = layers;
                    layers.classList.add('stls--layers');
                    const bg = document.createElement('img'); {
                        bg.classList.add('stls--layer');
                        bg.classList.add('stls--background');
                        bg.src = this.mapImage;
                        bg.addEventListener('pointerdown', (evt)=>{
                            evt.preventDefault();
                            evt.stopPropagation();
                            this.dom.time.value = '100';
                            const x = evt.layerX / bg.offsetWidth * 100;
                            const y = evt.layerY / bg.offsetHeight * 100;
                            const p = this.travelScreen.pointList.find(p=>p.x - 10 <= x && p.x + 10 >= x && p.y - 10 <= y && p.y + 10 >= y);
                            if (p) {
                                this.dragPoint = p;
                            } else {
                                const np = { x:Math.round(x), y:Math.round(y), dist:null, totalDist:null };
                                this.dragPoint = np;
                                this.travelScreen.pointList.push(np);
                                this.travelScreen.addDistance();
                                this.scaleCanvas();
                            }
                        });
                        bg.addEventListener('pointermove', (evt)=>{
                            evt.preventDefault();
                            evt.stopPropagation();
                            if (!this.dragPoint) return;
                            const x = evt.layerX / bg.offsetWidth * 100;
                            const y = evt.layerY / bg.offsetHeight * 100;
                            this.dragPoint.x = Math.round(x);
                            this.dragPoint.y = Math.round(y);
                            this.travelScreen.addDistance();
                            this.scaleCanvas();
                        });
                        bg.addEventListener('pointerup', (evt)=>{
                            evt.preventDefault();
                            evt.stopPropagation();
                            if (!this.dragPoint) return;
                            const x = evt.layerX / bg.offsetWidth * 100;
                            const y = evt.layerY / bg.offsetHeight * 100;
                            this.dragPoint.x = Math.round(x);
                            this.dragPoint.y = Math.round(y);
                            this.dragPoint = null;
                            this.travelScreen.addDistance();
                            this.updateCmd();
                            this.scaleCanvas();
                        });
                        bg.addEventListener('contextmenu', (evt)=>{
                            evt.preventDefault();
                            const x = evt.layerX / bg.offsetWidth * 100;
                            const y = evt.layerY / bg.offsetHeight * 100;
                            const p = this.travelScreen.pointList.find(p=>p.x - 10 <= x && p.x + 10 >= x && p.y - 10 <= y && p.y + 10 >= y);
                            if (p) {
                                this.travelScreen.pointList.splice(this.travelScreen.pointList.indexOf(p), 1);
                                this.travelScreen.addDistance();
                                this.updateCmd();
                                this.scaleCanvas();
                            }
                        });
                        layers.append(bg);
                    }
                    const prom = new Promise(resolve=>{
                        if (bg.complete) return resolve();
                        bg.addEventListener('load', resolve);
                        bg.addEventListener('error', resolve);
                    });
                    await prom;
                    this.width = bg.naturalWidth;
                    this.height = bg.naturalWidth;
                    this.travelScreen.width = bg.naturalWidth;
                    this.travelScreen.height = bg.naturalHeight;
                    const canvas = document.createElement('canvas'); {
                        this.dom.canvas = canvas;
                        this.context = canvas.getContext('2d');
                        this.travelScreen.context = this.context;
                        canvas.classList.add('stls--layer');
                        canvas.classList.add('stls--canvas');
                        this.context = canvas.getContext('2d');
                        layers.append(canvas);
                    }
                    root.append(layers);
                }
                const timeline = document.createElement('div'); {
                    this.dom.time = timeline;
                    timeline.classList.add('stls--timeline');
                    const inp = document.createElement('input'); {
                        inp.type = 'range';
                        inp.min = '0';
                        inp.max = '100';
                        inp.value = '100';
                        inp.setAttribute('list', 'stls--datalist');
                        inp.addEventListener('input', ()=>{
                            if (this.travelScreen.pointList.length) {
                                this.travelScreen.drawFrame(this.travelScreen.pointList.at(-1)?.totalDist * Number(inp.value) / 100);
                            }
                        });
                        timeline.append(inp);
                    }
                    const datalist = document.createElement('datalist'); {
                        datalist.id = 'stls--datalist';
                        const start = document.createElement('option'); {
                            start.value = '0';
                            start.label = '0.0s';
                            datalist.append(start);
                        }
                        const mid = document.createElement('option'); {
                            this.dom.timeMid = mid;
                            mid.value = '50';
                            mid.label = '0.0s';
                            datalist.append(mid);
                        }
                        const end = document.createElement('option'); {
                            this.dom.timeEnd = end;
                            end.value = '100';
                            end.label = '0.0s';
                            datalist.append(end);
                        }
                        timeline.append(datalist);
                    }
                    root.append(timeline);
                }
                const cmd = document.createElement('pre'); {
                    cmd.classList.add('stls--cmd');
                    const inner = document.createElement('code'); {
                        this.dom.cmd = inner;
                        inner.classList.add('hljs', 'language-stscript');
                        cmd.append(inner);
                    }
                    const copy = document.createElement('div'); {
                        copy.classList.add('stls--copy');
                        copy.classList.add('menu_button');
                        copy.classList.add('fa-solid', 'fa-fw', 'fa-copy');
                        copy.title = 'Copy command to clipboard';
                        copy.addEventListener('click', async()=>{
                            const text = this.makeCmd();
                            let ok = false;
                            try {
                                navigator.clipboard.writeText(text);
                                ok = true;
                            } catch {
                                console.warn('/copy cannot use clipboard API, falling back to execCommand');
                                const ta = document.createElement('textarea'); {
                                    ta.value = text;
                                    ta.style.position = 'fixed';
                                    ta.style.inset = '0';
                                    document.body.append(ta);
                                    ta.focus();
                                    ta.select();
                                    try {
                                        document.execCommand('copy');
                                        ok = true;
                                    } catch (err) {
                                        console.error('Unable to copy to clipboard', err);
                                    }
                                    ta.remove();
                                }
                            }
                            copy.classList.add(`stac--${ok ? 'success' : 'failure'}`);
                            await delay(1000);
                            copy.classList.remove(`stac--${ok ? 'success' : 'failure'}`);
                        });
                        cmd.append(copy);
                    }
                    root.append(cmd);
                }
            }
            document.body.append(root);
            root.showModal();
            await waitForFrame();
            this.updateCmd();
            this.scaleCanvas();
        }
        return this.dom.root;
    }

    scaleCanvas() {
        this.travelScreen.addDistance();
        const rect = this.dom.layers.getBoundingClientRect();
        const ow = rect.width;
        const oh = rect.height;
        if (Math.abs(ow - this.dom.canvas.width) > 2) {
            this.dom.canvas.width = ow;
            this.travelScreen.width = ow;
            this.travelScreen.pxWidth = ow;
        }
        if (Math.abs(oh - this.dom.canvas.height) > 2) {
            this.dom.canvas.height = oh;
            this.travelScreen.height = oh;
            this.travelScreen.pxHeight = oh;
        }
        const totalTime = (this.pointList.at(-1).totalDist / (this.travelScreen.speed * 0.5) * 30) / 100;
        this.dom.timeMid.label = `${Math.round(totalTime / 2) / 10}s`;
        this.dom.timeEnd.label = `${Math.round(totalTime) / 10}s`;
        this.drawCanvas();
    }

    drawCanvas() {
        if (this.travelScreen.pointList.length) {
            this.travelScreen.drawFrame(this.travelScreen.pointList.at(-1)?.totalDist);
        } else {
            this.context.clearRect(0, 0, this.dom.canvas.width, this.dom.canvas.height);
        }
    }


    makeCmd() {
        const points = this.travelScreen.pointList.map(it=>JSON.stringify([it.x, it.y])).join(',\n\t\t');
        return [
            `/indy map="${this.mapImage}"`,
            ...Object.entries(this.args)
                .filter(([k,v])=>k[0] != '_' && k != 'map')
                .map(([k,v])=>`${k}=${/^(\d+)?(\.\d+)?$/.test(v.toString()) ? v : `"${v.toString().replace(/"/g, '\\"')}"`}`),
            `[${points ? `\n\t\t${points}\n\t` : ''}]\n|`,
        ].join('\n\t');
    }
    updateCmd() {
        this.dom.cmd.innerHTML = hljs.highlight(this.makeCmd(), { language:'stscript', ignoreIllegals:true })?.value;
    }
}
