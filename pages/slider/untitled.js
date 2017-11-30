// config 实例
// {
//     "music": "",
//     "entity": [{
//         "src": "",
//         "type": "bg"  //bg、photo
//         "pos": {
//             "x": 0,
//             "y": 0
//         },
//         // 按照顺序来执行的动画数据
//         "animation":[{  
//             "duration": 1000    // 时间间隔，setTimeout
//         },{
//             "duration": 1000  
//             "left": 200,        // 动作类型，包括left right top bottom opacity play等
//             "bottom": {
//                 "value": 100,
//                 "func": ease    // 动画函数：linear,ease,ease-in,ease-in-out,ease-out
//             },
//             "play": [           //play表示按照图片src的数组，逐帧播放
//             ]
//         }, {
//             "duration": 1000,
//             "opacity": 0,
//             "goto": 1,          // 跳到某个帧开始播放
//         }],
//     }]
// }