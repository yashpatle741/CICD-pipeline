pipeline{
    agent any

       
stages{
    stage('clone repo'){

        steps{
            git branch: 'main' , 
            url: 'https://github.com/yashpatle741/CICD-pipeline.git'
        }
    }

    stage('build image'){

        steps{

          sh 'docker build -t CICD-pipeline .'
        }
    }

    stage('stop old container'){

        steps{
            sh 'docker stop CICD-container || true'
            sh 'docker rm CICD-container || true' 
        }
    }

    stage('run containers'){

       steps{
        sh  'docker run -d -p 3000:3000 --name CICD-container CICD-pipeline'
       }
    }
 }
}

