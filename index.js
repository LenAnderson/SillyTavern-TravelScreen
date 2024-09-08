import { SlashCommand } from '../../../slash-commands/SlashCommand.js';
import { ARGUMENT_TYPE, SlashCommandArgument, SlashCommandNamedArgument } from '../../../slash-commands/SlashCommandArgument.js';
import { SlashCommandParser } from '../../../slash-commands/SlashCommandParser.js';
import { TravelHelper } from './src/TravelHelper.js';
import { LOADING_SCREEN_SIZE, TravelScreen } from './src/TravelScreen.js';


SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'indy',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  size:"full"|"inset",
     *  blur:string,
     *  background:string,
     *  color:string,
     *  classes:string,
     *  map:string,
     *  speed:string,
     *  zoom:string,
     *  linewidth:string,
     *  linecolor:string,
     *  lineshadow:string,
     *  lineshadowcolor:string,
     *  pointsize:string,
     *  pointcolor:string,
     *  pointshadow:string,
     *  pointshadowcolor:string,
     *  waitbefore:string,
     *  waitafter:string,
     *  sfx:string,
     *  volume:string,
     *  offset:string,
     *  fadeIn:string,
     *  fadeOut:string,
     * }} args
     * @param {*} value
     * @returns
     */
    callback: async(args, value)=>{
        const ls = new TravelScreen();
        ls.size = Object.values(LOADING_SCREEN_SIZE).find(it=>it == args.size) ?? ls.size;
        ls.blur = Number(args.blur ?? ls.blur);
        ls.backgroundColor = args.color;
        ls.backgroundImage = args.background;
        let classList = args.classes;
        try { classList = JSON.parse(args.classes ?? '[]'); } catch { /* not JSON */ }
        ls.classList = Array.isArray(classList) ? classList : [classList];
        ls.mapImage = args.map;
        ls.zoom = Number(args.zoom ?? ls.zoom);
        ls.speed = Number(args.speed ?? ls.speed);
        ls.pointList = JSON.parse(value ?? '[]').map(it=>({ x:it[0], y:it[1], dist:null, totalDist:null }));
        ls.lineWidth = Number(args.linewidth ?? ls.lineWidth);
        ls.lineColor = args.linecolor ?? ls.lineColor;
        ls.lineShadowSize = Number(args.lineshadow ?? ls.lineShadowSize);
        ls.lineShadowColor = args.lineshadowcolor ?? ls.lineShadowColor;
        ls.pointSize = Number(args.pointsize ?? ls.pointSize);
        ls.pointColor = args.pointcolor ?? ls.pointColor;
        ls.pointShadowSize = Number(args.pointshadow ?? ls.pointShadowSize);
        ls.pointShadowColor = args.pointshadowcolor ?? ls.pointShadowColor;
        ls.waitBefore = Number(args.waitbefore ?? ls.waitBefore);
        ls.waitAfter = Number(args.waitafter ?? ls.waitAfter);
        ls.sfxUrl = args.sfx;
        ls.sfxVolume = Number(args.volume ?? ls.sfxVolume);
        ls.sfxOffset = Number(args.offset ?? ls.sfxOffset);
        ls.sfxFadeIn = Number(args.fadein ?? ls.sfxFadeIn);
        ls.sfxFadeOut = Number(args.fadeout ?? ls.sfxFadeOut);
        ls.fps = Number(args.fps ?? ls.fps);

        await ls.start();

        return '';
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'map',
            description: 'URL pointing to a map image',
            isRequired: true,
        }),
        SlashCommandNamedArgument.fromProps({ name: 'size',
            description: 'map size',
            enumList: Object.values(LOADING_SCREEN_SIZE),
            defaultValue: 'full',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'blur',
            description: 'blur strength for background behind the map (if inset)',
            typeList: ARGUMENT_TYPE.NUMBER,
            defaultValue: '6',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'background',
            description: 'URL pointing to a background image to put behind the map (if inset)',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'classes',
            description: 'a single class or list of classes to add to the map element, for targeting with custom CSS',
            typeList: [ARGUMENT_TYPE.LIST, ARGUMENT_TYPE.STRING],
        }),
        // TIMING & ANIMATION
        SlashCommandNamedArgument.fromProps({ name: 'speed',
            description: 'speed of the animation',
            typeList: [ARGUMENT_TYPE.NUMBER],
            defaultValue: '1.0',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'fps',
            description: 'frames per second for the animation',
            typeList: [ARGUMENT_TYPE.NUMBER],
            defaultValue: '60',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'zoom',
            description: 'map zoom level (1.0 = fit screen)',
            typeList: [ARGUMENT_TYPE.NUMBER],
            defaultValue: '1.0',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'waitbefore',
            description: 'time to wait before travel animation begins (ms)',
            typeList: [ARGUMENT_TYPE.NUMBER],
            defaultValue: '1000',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'waitbefore',
            description: 'time to wait after travel animation has finished (ms)',
            typeList: [ARGUMENT_TYPE.NUMBER],
            defaultValue: '1000',
        }),
        // DRAWING
        SlashCommandNamedArgument.fromProps({ name: 'linewidth',
            description: 'width of the travel line (pixel)',
            typeList: [ARGUMENT_TYPE.NUMBER],
            defaultValue: '10',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'linecolor',
            description: 'color of the travel line (any CSS color)',
            defaultValue: 'red',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'lineshadow',
            description: 'width of the shadow dropped by the travel line (pixel)',
            typeList: [ARGUMENT_TYPE.NUMBER],
            defaultValue: '4',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'lineshadowcolor',
            description: 'color of the shadow dropped by the travel line (any CSS color)',
            defaultValue: 'rgb(0 0 0 / 0.5)',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'pointsize',
            description: 'size of the travel points (diameter in pixel)',
            typeList: [ARGUMENT_TYPE.NUMBER],
            defaultValue: '20',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'pointcolor',
            description: 'color of the travel points (any CSS color)',
            defaultValue: 'red',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'pointshadow',
            description: 'width of the shadow dropped by the travel points (pixel)',
            typeList: [ARGUMENT_TYPE.NUMBER],
            defaultValue: '6',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'pointshadowcolor',
            description: 'color of the shadow dropped by the travel points (any CSS color)',
            defaultValue: 'black',
        }),
        // SFX
        SlashCommandNamedArgument.fromProps({ name: 'sfx',
            description: 'audio file to play during the travel animation',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'volume',
            description: 'volume of the audio file',
            typeList: [ARGUMENT_TYPE.NUMBER],
            defaultValue: '0.25',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'offset',
            description: 'offset to play the audio file from (ms)',
            typeList: [ARGUMENT_TYPE.NUMBER],
            defaultValue: '0',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'fadein',
            description: 'time to fade audio in (ms)',
            typeList: [ARGUMENT_TYPE.NUMBER],
            defaultValue: '2000',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'fadeout',
            description: 'time to fade audio out (ms)',
            typeList: [ARGUMENT_TYPE.NUMBER],
            defaultValue: '2000',
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: 'list of points to draw the lines between, points as percentages of width and height',
            typeList: [ARGUMENT_TYPE.LIST],
            isRequired: true,
        }),
    ],
    helpString: `
        <div>
            Shows a travel loading screen with a line progressing along
            points on a map.
        </div>
        <div>
            Points are given as a list of coordinates ([x,y] pairs) expresed
            as percentage of the map width/height from the top-left corner.
        </div>
        <div>
            <strong>Example:</strong>
            <ul>
                <li>
                    Travel from top-left corner to bottom-right corner.
<pre><code class="language-stscript">/indy map="/user/images/map.png" [
    [0, 0],
    [100, 100]
]</code></pre>
                </li>
                <li>
                    Travel from left to right through the center of the map.
<pre><code class="language-stscript">/indy map="/user/images/map.png" [
    [0, 50],
    [100, 50]
]</code></pre>
                </li>
                <li>
                    Travel from bottom to top through the center of the map.
<pre><code class="language-stscript">/indy map="/user/images/map.png" [
    [50, 100],
    [50, 0]
]</code></pre>
                </li>
                <li>
                    Travel through several points.
<pre><code class="language-stscript">/indy map="/user/images/map.png" [
    [20, 80],
    [40, 45],
    [60, 55],
    [75, 10]
]</code></pre>
                </li>
                <li>
                    Travel through several points with zoom (moving map).
<pre><code class="language-stscript">/indy map="/user/images/map.png" zoom=2 [
    [20, 80],
    [40, 45],
    [60, 55],
    [75, 10]
]</code></pre>
                </li>
            </ul>
        </div>
    `,
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'indy-helper',
    /**
     *
     * @param {*} args
     * @param {string} value
     * @returns
     */
    callback: (args, value)=>{
        const h = new TravelHelper();
        h.mapImage = args.map.toString();
        h.pointList = JSON.parse(value || '[]').map(it=>({ x:it[0], y:it[1], dist:null, totalDist:null }));
        h.args = args;
        h.render();
        return '';
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'map',
            description: 'URL pointing to a map image',
            isRequired: true,
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: 'list of points to draw the lines between, points as percentages of width and height',
            typeList: [ARGUMENT_TYPE.LIST],
        }),
    ],
    helpString: `
        <div>
            Helper to set points on a travel map.
        </div>
        <div>
            <strong>Example:</strong>
            <ul>
                <li>
                    <pre><code class="language-stscript">/indy-helper /user/images/map.png</code></pre>
                </li>
            </ul>
        </div>
    `,
}));
