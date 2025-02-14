from setuptools import setup, find_packages

setup(
    name="taxguru",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        'flask>=3.0.2',
        'openai>=1.12.0',
        'python-dotenv>=1.0.1',
    ],
)
