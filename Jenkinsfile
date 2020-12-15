pipeline {
  agent any
    environment {
        root = tool name: 'Go1.15.6', type: 'go'
    }
    tools {nodejs "NodeJS15.4.0"}
  stages {
    stage('install dependency') {
      steps {
        sh 'cd store-web && npm install'
      }
    }

    stage('code analysis') {
      parallel {
        stage('code analysis frontend') {
          steps {
            sh 'cd store-web && npm run lint'
          }
        }

        stage('code analysis backend') {
          steps {
            script {
              withEnv(["GOROOT=${root}", "PATH+GO=${root}/bin"]){
                sh 'export cgo_enabled=0'
                sh 'go get github.com/jstemmer/go-junit-report'
                sh 'cd store-service && go vet ./...'
              }
            }
            
          }
        }
      }
    }

    stage('run unit test') {
      parallel {
        stage('code analysis frontend') {
          steps {
            sh 'make run_unittest_frontend'
          }
        }

        stage('code analysis backend') {
          steps {
            sh 'make run_unittest_backend'
            junit 'store-service/*.xml'
            script{
                def scannerHome = tool 'SonarQubeScanner';
                withSonarQubeEnv('SonarQubeScanner'){
                    sh "${scannerHome}/bin/sonar-scanner"
                }
            }
          }
        }

      }
    }

    stage('setup test fixtures') {
      steps {
        sh 'docker-compose up -d store-database bank-gateway shipping-gateway'
      }
    }

    stage('run integration test') {
      steps {
        // sh 'make run_integratetest_backend'
        sh 'cd store-service && go test -tags=integration ./...'
      }
    }

    stage('build') {
      parallel {
        stage('build frontend') {
          steps {
            sh 'make build_frontend'
          }
        }

        stage('build backend') {
          steps {
            sh 'make build_backend'
          }
        }

      }
    }

    stage('run ATDD') {
      steps {
        sh 'make start_service'
        sh 'make run_newman'
        sh 'make run_robot'
        sh 'make stop_service'
      }
    }

  }
  post {
    always {
      robot outputPath: './', passThreshold: 100.0
      sh 'make stop_service'
      sh 'docker volume prune -f'
    }

  }
}