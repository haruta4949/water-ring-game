// Matter.jsモジュールのエイリアス
const Engine = Matter.Engine;
const Render = Matter.Render;
const World = Matter.World;
const Bodies = Matter.Bodies;
const Body = Matter.Body;
const Events = Matter.Events;

// ゲームエリアのDOM要素
const gameArea = document.getElementById('game-area');
const startButton = document.getElementById('startButton');
const messageContainer = document.getElementById('message-container');

// エンジンの作成
const engine = Engine.create();
const world = engine.world;

// レンダラーの作成
const render = Render.create({
    element: gameArea,
    engine: engine,
    options: {
        width: gameArea.clientWidth,
        height: gameArea.clientHeight,
        wireframes: false, // リアルな表示にする
        background: 'transparent' // CSSで背景を設定するため
    }
});

// 重力を調整 (水の浮力をシミュレートするために弱くする)
world.gravity.y = 0.5; // 必要に応じて調整

// ゲームエリアの境界線（壁）の作成
const wallThickness = 20;
const wallOptions = {
    isStatic: true,
    render: {
        fillStyle: '#039be5' // 境界線の色
    }
};

World.add(world, [
    // 下の壁
    Bodies.rectangle(gameArea.clientWidth / 2, gameArea.clientHeight + wallThickness / 2, gameArea.clientWidth, wallThickness, wallOptions),
    // 左の壁
    Bodies.rectangle(-wallThickness / 2, gameArea.clientHeight / 2, wallThickness, gameArea.clientHeight, wallOptions),
    // 右の壁
    Bodies.rectangle(gameArea.clientWidth + wallThickness / 2, gameArea.clientHeight / 2, wallThickness, gameArea.clientHeight, wallOptions),
    // 上の壁 (リングが飛び出さないように)
    Bodies.rectangle(gameArea.clientWidth / 2, -wallThickness / 2, gameArea.clientWidth, wallThickness, wallOptions)
]);

// リングの作成
const rings = [];
const numRings = 5;
const ringRadius = 20;
const ringOptions = {
    restitution: 0.8, // 反発係数
    friction: 0.01,   // 摩擦
    density: 0.005,   // 密度 (水に浮くように軽くする)
    render: {
        fillStyle: '#ffeb3b', // 黄色いリング
        strokeStyle: '#fbc02d',
        lineWidth: 2
    },
    label: 'ring'
};

for (let i = 0; i < numRings; i++) {
    const ring = Bodies.circle(
        gameArea.clientWidth / 2 + (i - Math.floor(numRings / 2)) * 50, // 横に並べて配置
        gameArea.clientHeight / 2,
        ringRadius,
        ringOptions
    );
    rings.push(ring);
    World.add(world, ring);
}

// ゴール（杭）の作成
const goals = [];
const goalWidth = 10;
const goalHeight = 50;
const goalOptions = {
    isStatic: true,
    render: {
        fillStyle: '#795548' // 茶色の杭
    },
    label: 'goal'
};

const numGoals = 3; // ゴールの数
for (let i = 0; i < numGoals; i++) {
    const goalX = (gameArea.clientWidth / (numGoals + 1)) * (i + 1);
    const goalY = gameArea.clientHeight - goalHeight / 2 - wallThickness; // 下の壁の上に配置
    const goal = Bodies.rectangle(goalX, goalY, goalWidth, goalHeight, goalOptions);
    goals.push(goal);
    World.add(world, goal);
}


// エンジンとレンダラーの実行
Engine.run(engine);
Render.run(render);

// 水流を発生させる関数
function generateWaterCurrent() {
    // 画面中央下から上に向かってランダムな水流を発生させる
    const forceMagnitude = 0.05; // 水流の強さ
    const forceAngle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 4; // 上向き±45度の範囲

    rings.forEach(ring => {
        const forceX = forceMagnitude * Math.cos(forceAngle);
        const forceY = forceMagnitude * Math.sin(forceAngle);
        Body.applyForce(ring, ring.position, { x: forceX, y: forceY });
    });
}

// ボタンクリックイベント
startButton.addEventListener('click', generateWaterCurrent);

// クリア判定のロジック
// リングとゴールの衝突を監視
Events.on(engine, 'collisionStart', function(event) {
    const pairs = event.pairs;

    pairs.forEach(pair => {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        let ringBody, goalBody;

        if (bodyA.label === 'ring' && bodyB.label === 'goal') {
            ringBody = bodyA;
            goalBody = bodyB;
        } else if (bodyA.label === 'goal' && bodyB.label === 'ring') {
            ringBody = bodyB;
            goalBody = bodyA;
        }

        if (ringBody && goalBody) {
            // リングがゴールに入ったと判定
            // 簡単のために、リングがゴールのX座標範囲内に入ったら成功とする
            const goalLeft = goalBody.position.x - goalBody.bounds.width / 2;
            const goalRight = goalBody.position.x + goalBody.bounds.width / 2;
            const ringX = ringBody.position.x;

            if (ringX > goalLeft && ringX < goalRight) {
                // リングをゴールの「中」に固定する
                Body.setStatic(ringBody, true); // 動きを止める
                ringBody.render.fillStyle = '#4caf50'; // 成功したリングの色
                checkWinCondition();
            }
        }
    });
});


function checkWinCondition() {
    // すべてのリングが静的（ゴールに入った状態）かチェック
    const allRingsInGoals = rings.every(ring => ring.isStatic);

    if (allRingsInGoals) {
        messageContainer.textContent = 'ゲームクリア！おめでとう！';
        startButton.disabled = true; // ゲームクリア後ボタンを無効化
    }
}

// 画面サイズ変更時のリサイズ処理 (オプション)
window.addEventListener('resize', () => {
    render.options.width = gameArea.clientWidth;
    render.options.height = gameArea.clientHeight;
    Render.set
    // 境界線の位置も更新する必要があるが、複雑になるためここでは省略
    // シンプルなゲームなので、初期サイズで固定とするか、
    // ゲーム全体を再初期化する方が簡単かもしれません
});
