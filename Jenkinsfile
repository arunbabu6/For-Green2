pipeline {
    agent none

    environment {
        DOCKER_IMAGE = 'arunthopil/pro-green-v2'
        SONARQUBE_TOKEN = credentials('sonar-docker')
        DOCKERHUB_CREDENTIALS = credentials('dockerhub1')
        // SSH credentials for each environment
        DEMO_SSH_CREDENTIALS = credentials('ssh-wsl')
        TEST_SSH_CREDENTIALS = credentials('test-ssh-credentials-id')
        STAGE_SSH_CREDENTIALS = credentials('stage-ssh-credentials-id')
        PROD_SSH_CREDENTIALS = credentials('prod-ssh-credentials-id')
        // Docker Hosts setup
        DEMO_DOCKER_HOST = 'ssh://host.docker.internal'
        TEST_DOCKER_HOST = 'ssh://test-user@test-docker-host'
        STAGE_DOCKER_HOST = 'ssh://stage-user@stage-docker-host'
        PROD_DOCKER_HOST = 'ssh://prod-user@prod-docker-host'
        PROJECT_DIR = '/opt/docker-green'
    }

    stages {
        stage('Setup') {
            agent any
            steps {
                script {
                    env.ENVIRONMENT = BRANCH_NAME == 'main' ? 'Demo' :
                                  BRANCH_NAME == 'production' ? 'Production' :
                                  BRANCH_NAME == 'staging' ? 'Staging' :
                                  BRANCH_NAME.startsWith('test') ? 'Testing' : 'Development'
                    echo "Environment set to ${env.ENVIRONMENT}"
                }
            }
        }

        stage('Checkout Code') {
            agent any
            steps {
                checkout scm
            }
        }

        stage('Clean Workspace') {
            agent any
            steps {
                 script {
                    if (fileExists('.')) {
                        deleteDir()
                    } else {
                        echo "Workspace directory does not exist, no need to delete."
                    }
                 }
             }
        }

        stage('Use Artifacts') {
            steps {
                script {
                    if (currentBuild.previousBuild != null && currentBuild.previousBuild.result == 'SUCCESS') {
                        copyArtifacts(projectName: "${JOB_NAME}", selector: lastSuccessful(), filter: 'lint-results.txt');
                    } else {
                        echo "No previous successful build found. Skipping artifact copy."
                    }
                }
            }
        }

        stage('Stash Client') {
            agent any
            steps {
                dir('client') {
                    stash includes: '**', name: 'client-src'
                }
            }
        }

        stage('Prepare and Build') {
            agent any
            steps {
                script {
                    unstash 'client-src'
                    dir('client') {
                        // Assuming the build commands are here
                        sh 'npm install'
                        sh 'npm run build'
                        // Stash the build artifacts, excluding the node_modules directory
                        stash excludes: 'node_modules/**', includes: '**', name: 'build-artifacts'
                    }
                }
            }
        }

        // SonarQube Analysis and Snyk Security Scan 
        stage('SonarQube Analysis') {
            agent any
            steps {
                withSonarQubeEnv('Sonarqube') { // 'Sonarcube-cred' from |should match the SonarQube configuration in Jenkins
                    sh """
                      sonar-scanner \
                      -Dsonar.projectKey=Project-Green2 \
                      -Dsonar.sources=. \
                      -Dsonar.host.url=http://172.19.0.4:9000/ \
                      -Dsonar.login=$SONARQUBE_TOKEN
                    """
                }
            }
        }

        stage('Snyk Security Scan') {
            agent any
            steps {
                dir('client') {
        //        snykSecurity failOnError: false, failOnIssues: false, organisation: 'arunbabu6', projectName: 'For-Green2', snykInstallation: 'Snyk', snykTokenId: 'snyk-token', targetFile: 'package.json'
                snykSecurity failOnError: false, failOnIssues: false, organisation: 'arunbabu6', projectName: 'For-Green2', snykInstallation: 'Snyk', snykTokenId: 'snyk-token'
                }

            }
        }

        stage('Build and Push Docker Image') {
            agent any
            steps {
                script {
                    // Create a directory 'artifacts' in the Jenkins workspace to hold the unstashed files
                    sh "mkdir -p artifacts"
                    dir('artifacts') {
                        // Unstash the build artifacts into this 'artifacts' directory
                        unstash 'build-artifacts'
                        }
                        sshagent(['jenkinaccess']) {
                            // Clear the 'artifacts' directory on the Docker host
                            sh "ssh ab@host.docker.internal 'rm -rf ${PROJECT_DIR}/artifacts/*'"
                            sh "scp -rp artifacts/* ab@host.docker.internal:${PROJECT_DIR}/artifacts/"
                            // Build the Docker image on the Docker host
                            sh "ssh ab@host.docker.internal 'cd ${PROJECT_DIR} && docker build -t ${env.DOCKER_IMAGE}-frontend:${env.ENVIRONMENT.toLowerCase()}-${env.BUILD_NUMBER} .'"
                        }
                        // Log in to DockerHub and push the image
                        withCredentials([usernamePassword(credentialsId: 'dockerhub1', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                            sh """
                                echo '${DOCKER_PASSWORD}' | ssh ab@host.docker.internal 'docker login -u ${DOCKER_USERNAME} --password-stdin' > /dev/null 2>&1
                                ssh ab@host.docker.internal 'docker push ${env.DOCKER_IMAGE}-frontend:${env.ENVIRONMENT.toLowerCase()}-${env.BUILD_NUMBER}'
                            """
                        }

                    }
            }
        }

        stage('Deploy') {      
            agent any  
            steps {
                script {
                    def sshHost = ''
                    def sshCredentialsId = ''

                    switch (ENVIRONMENT) {
                        case 'Demo':
                            sshHost = 'host.docker.internal'
                            sshCredentialsId = 'dockerhub1'
                            break
                        case 'Testing':
                            sshHost = 'ab@test-host.docker.internal'
                            sshCredentialsId = 'test-ssh-credentials'
                            break
                        case 'Staging':
                            sshHost = 'ab@staging-host.docker.internal'
                            sshCredentialsId = 'staging-ssh-credentials'
                            break
                        case 'Production':
                            sshHost = 'ab@production-host.docker.internal'
                            sshCredentialsId = 'production-ssh-credentials'
                            break
                        default:
                            echo "Environment configuration not found"
                            return
                    }

                    sshagent([sshCredentialsId]) {
                        sh """
                            ssh -o StrictHostKeyChecking=no ${sshHost} '
                            docker pull ${env.DOCKER_IMAGE}-frontend:${env.ENVIRONMENT.toLowerCase()}-${env.BUILD_NUMBER} &&
                            docker stop projectname-frontend || true &&
                            docker rm projectname-frontend || true &&
                            docker run -d --name projectname-frontend -p 80:3000 ${env.DOCKER_IMAGE}-frontend:${env.ENVIRONMENT.toLowerCase()}-${env.BUILD_NUMBER}
                            '
                        """
                        // Additional commands for backend container
                    }   
                }
            }
        }

    post {
        always {
            script {
                if (env.ENVIRONMENT) {
                    echo "Pipeline execution completed for ${env.ENVIRONMENT}"
                    } else {
                        echo "Pipeline execution completed, but ENVIRONMENT was not set."
                    }
            }   
        }
    }
    }
}
