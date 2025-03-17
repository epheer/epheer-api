module.exports = {
    apps: [
        {
            name: 'epheer-api',
            script: 'app.js',
            instances: 'max',
            exec_mode: 'cluster',
        },
    ],
};