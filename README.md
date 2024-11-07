# LabMob
cd LabMob

# Per far partire l'app web su android
npm install @capacitor/core @capacitor/cli @capacitor/motion @capacitor/local-notifications
npm install chart.js chartjs-plugin-datalabels --save
npm install @types/chart.js --save-dev

ionic serve
 
ionic build
npx cap sync
ionic capacitor sync
ionic capacitor open android

