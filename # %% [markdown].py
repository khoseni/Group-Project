# %% [markdown]
# ## Imports

# %%


# 1. to handle the data
import pandas as pd
import numpy as np
from scipy import stats

# to visualize the data
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px

# To preprocess the data
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder,OneHotEncoder
from sklearn.impute import SimpleImputer, KNNImputer
# import iterative imputer
from sklearn.experimental import enable_iterative_imputer
from sklearn.impute import IterativeImputer

# machine learning
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
#for classification tasks
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, AdaBoostClassifier, GradientBoostingClassifier, RandomForestRegressor
from sklearn.svm import SVC
from sklearn.naive_bayes import GaussianNB
# pipeline
from sklearn.pipeline import Pipeline
# metrics
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report, mean_absolute_error,mean_squared_error,r2_score

# ignore warnings
import warnings
warnings.filterwarnings('ignore')

from collections import Counter
from statistics import stdev

# %% [markdown]
# ## Data loading

# %%
df = pd.read_csv("/Users/lesegomosikari/Desktop/Capstone project/Machine learning/archivetempsupermarket_churnData.csv")

# %% [markdown]
# ## Extract loaded datase

# %%
# print all column
pd.set_option('display.max_columns', None)
# print first 10 rows
df.head(10)

# %%
df['customer_churn'].head(10)

# %%
# check info
df.info()

# %% [markdown]
# ## Data cleaning

# %%
# drop missing values
df.dropna(inplace=True)

# drop invoice_id
df.drop('invoice_id', axis=1, inplace=True)
df.drop('customer_id', axis=1, inplace=True)
df.drop('row_number', axis=1, inplace=True)

# %%
# check missing value
print(df.isnull().sum())

# %%
# distinction is based on the number of different values in the column

columns = list(df.columns)

categoric_columns = []
numeric_columns = []

for i in columns:
    if len(df[i].unique()) > 6:
        numeric_columns.append(i)
    else:
        categoric_columns.append(i)

categoric_columns = categoric_columns[:-1] # Excluding 'Churn'

# %%
numeric_columns

# %%
# Label Encoding refers to converting the labels into a numeric form.
# This is only for EDA reasons. Later we will use OneHotEncoder to prepare for model building.
from sklearn.preprocessing import LabelEncoder
le = LabelEncoder()

df1 = df.copy()

df1[categoric_columns] = df1[categoric_columns].apply(le.fit_transform)
df1[['customer_churn']] = df1[['customer_churn']].apply(le.fit_transform)

print('Label Encoder Transformation')
for i in categoric_columns :
    df1[i] = le.fit_transform(df1[i])
    print(i,' : ',df1[i].unique(),' = ',le.inverse_transform(df1[i].unique()))

# %%
df1[numeric_columns].describe()

# %%
from sklearn.preprocessing import MinMaxScaler,StandardScaler
mms = MinMaxScaler() # Normalization
ss = StandardScaler() # Standardization




df1['age'] = mms.fit_transform(df1[['age']])
df1['credit_score'] = mms.fit_transform(df1[['credit_score']])
df1['number_of_products'] = mms.fit_transform(df1[['number_of_products']])
df1['total_amount'] = mms.fit_transform(df1[['total_amount']])
df1['price'] = mms.fit_transform(df1[['price']])
df1['tax_amount'] = mms.fit_transform(df1[['tax_amount']])
df1['product_category'] = mms.fit_transform(df1[['product_category']])
df1['gender'] = mms.fit_transform(df1[['gender']])
df1['branch'] = mms.fit_transform(df1[['branch']])
df1['ratings'] = mms.fit_transform(df1[['ratings']])
df1.head()

# %%
import pandas as pd

# Assuming df1 is your DataFrame and 'customer_churn' is the column with continuous values
df1['customer_churn_binary'] = (df1['customer_churn'] > 0.5).astype(int)

# Verify the transformation
print(df1['customer_churn_binary'].value_counts())

# %%
t1 = df1['customer_churn']
print("Unique values in t1:", np.unique(t1))
print("Data type of t1:", t1.dtype)


# %%
import pandas as pd
from imblearn.over_sampling import SMOTE
from collections import Counter
from sklearn.linear_model import Lasso
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, mean_squared_error

# Assuming you have a DataFrame df1 and a binary target t1

# Convert continuous values to binary (e.g., using a threshold of 0.5)
t1_binary = (t1 > 0.5).astype(int)

# Apply SMOTE
smote = SMOTE()

# Select all columns as features (excluding the target variable)
X = df1.drop('customer_churn', axis=1).values
y = t1_binary  # Converted binary target variable

# Resample the dataset using SMOTE
X_resampled, y_resampled = smote.fit_resample(X, y)
print(Counter(y_resampled))

# Step 1: Split the resampled data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X_resampled, y_resampled, test_size=0.2, random_state=42)

# Step 2: Scale the data (important for LASSO)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Step 3: Initialize and fit LASSO
# You might tune the alpha value based on your specific data; here we start with 0.1
lasso = Lasso(alpha=0.1)

# Fit the LASSO model on the training data
lasso.fit(X_train_scaled, y_train)

# Step 4: Make predictions
y_pred = lasso.predict(X_test_scaled)

# Convert predictions to binary classification (since LASSO predicts continuous values)
y_pred_binary = (y_pred > 0.5).astype(int)

# Step 5: Evaluate the model
accuracy = accuracy_score(y_test, y_pred_binary)
print(f"Accuracy: {accuracy}")

# Optionally, calculate Mean Squared Error (since LASSO is a regression method by default)
mse = mean_squared_error(y_test, y_pred)
print(f"Mean Squared Error: {mse}")

# Step 6: Inspect feature coefficients (LASSO performs feature selection by shrinking coefficients)
lasso_coefficients = pd.Series(lasso.coef_, index=df1.drop('customer_churn', axis=1).columns)
print("Selected Features with Non-zero Coefficients:")
print(lasso_coefficients[lasso_coefficients != 0])


# %%
# Split the resampled data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X_resampled, y_resampled, test_size=0.3, random_state=42)


# %% [markdown]
# ## Future Engineering

# %% [markdown]
# ### Train test split - stratified splitting

# %%
df3=df
df3[['customer_churn']] = df3[['customer_churn']].apply(le.fit_transform)

X = df3.drop('customer_churn', axis=1)
y = df3['customer_churn']

# %%
from sklearn.model_selection import train_test_split
X_train, X_test, y_train, y_test = train_test_split(X, y, stratify=y, test_size = 0.25, random_state = 42)

# %% [markdown]
# ### Feature scaling

# %%
from sklearn.preprocessing import StandardScaler
Standard_Scaler = StandardScaler()
Standard_Scaler.fit_transform(X_train[numeric_columns])
Standard_Scaler.transform(X_test[numeric_columns])

# %% [markdown]
# ### One hot Encoder

# %%
print(categoric_columns)

# %%
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import make_column_transformer
# Encoding multiple columns. Unfortunately you cannot pass a list here so you need to copy-paste all printed categorical columns.
transformer = make_column_transformer(
    (OneHotEncoder(handle_unknown='ignore'),
     ['branch', 'gender', 'customer_type', 'has_creditcard', 'is_active_member', 'product_category']
    ))


# %%
# Transforming
transformed = transformer.fit_transform(X_train)
# Transformating back
transformed_df = pd.DataFrame(transformed, columns=transformer.get_feature_names_out())
# One-hot encoding removed index. Let's put it back:
transformed_df.index = X_train.index

# Joining tables
X_train = pd.concat([X_train, transformed_df], axis=1)

X_train.drop(categoric_columns, axis=1, inplace=True) # Dropping categorical columns

# %%
# Transforming
transformed = transformer.transform(X_test)
# Transformating back
transformed_df = pd.DataFrame(transformed, columns=transformer.get_feature_names_out())
# One-hot encoding removed index. Let's put it back:
transformed_df.index = X_test.index

# Joining tables
X_test = pd.concat([X_test, transformed_df], axis=1)

X_test.drop(categoric_columns, axis=1, inplace=True) # Dropping categorical columns


# %% [markdown]
# ## Model building

# %%
from sklearn.metrics import confusion_matrix, recall_score, precision_score, f1_score, accuracy_score, roc_auc_score
from sklearn.metrics import classification_report

# %%
print(X_train.columns)

# %% [markdown]
# ### Feature importance

# %%
# Identify categorical columns
categorical_cols = df.select_dtypes(include=['category', 'object']).columns

# Apply OneHotEncoder
encoder = OneHotEncoder(sparse_output=False)
encoded_data = encoder.fit_transform(df[categorical_cols])

# Create a DataFrame from the encoded data
encoded_df = pd.DataFrame(encoded_data, columns=encoder.get_feature_names_out(categorical_cols))

# Drop the original categorical columns from the DataFrame
df.drop(columns=categorical_cols, inplace=True)

# Reset index of the DataFrame
df.reset_index(drop=True, inplace=True)

# Concatenate the original DataFrame with the encoded DataFrame
df = pd.concat([df, encoded_df], axis=1)

# %%
df1.head()

# %%
X_train.head()

# %% [markdown]
# ###  Baseline - Random Fores

# %%
# Initialize the model


rf = RandomForestClassifier(n_estimators=100, max_leaf_nodes=50, random_state=42)





# Train the model

rf.fit(X_train, y_train)



# Make predictions

y_pred_rf = rf.predict(X_test)


# Print performance metrics
def print_metrics(y_test, y_pred, model_name):
    print(f"Metrics for {model_name}:")
    print("Accuracy:", accuracy_score(y_test, y_pred))
    print("Classification Report:\n", classification_report(y_test, y_pred))
    print("Confusion Matrix:\n", confusion_matrix(y_test, y_pred))
    print("\n" + "="*40 + "\n")


# Classification report
print(classification_report(y_test, y_pred_rf))




# %%

print_metrics(y_test, y_pred_rf, "Random Forest")



# %%
# Function to plot confusion matrix
def plot_confusion_matrix(y_true, y_pred, model_name):
    cm = confusion_matrix(y_true, y_pred)
    cm_df = pd.DataFrame(cm, index=['Class 0', 'Class 1'], columns=['Class 0', 'Class 1'])

    plt.figure(figsize=(8, 6))
    sns.heatmap(cm_df, annot=True, fmt='d', cmap='Blues', cbar=True,
                linewidths=0.5, linecolor='black')
    plt.xlabel('Predicted Labels')
    plt.ylabel('True Labels')
    plt.title(f'Confusion Matrix for {model_name}')
    plt.show()

# Plot confusion matrices for model

plot_confusion_matrix(y_test, y_pred_rf, 'Random Forest')



# %%


# %%



